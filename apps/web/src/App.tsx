import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { DaySlot, WeekData, WeekEntry } from "./types";

const dayGroups = [
  ["mon", "周一"],
  ["tue", "周二"],
  ["wed", "周三"],
  ["thu", "周四"],
  ["fri", "周五"],
  ["weekend", "周末"],
] as const;

export function App() {
  const [week, setWeek] = useState<WeekData | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeDay, setActiveDay] = useState<DaySlot>("mon");
  const [isPasting, setIsPasting] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    void loadWeek();
  }, [weekOffset]);

  useEffect(() => {
    if (!week) {
      return;
    }

    setNoteDraft(week.note);
  }, [week]);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      if (!event.clipboardData) {
        return;
      }

      const imageItem = [...event.clipboardData.items].find((item) =>
        item.type.startsWith("image/"),
      );

      if (!imageItem) {
        return;
      }

      const file = imageItem.getAsFile();
      if (!file || !week) {
        return;
      }

      event.preventDefault();
      setIsPasting(true);

      const reader = new FileReader();
      reader.onload = async () => {
        const imageDataUrl = String(reader.result ?? "");
        const dimensions = await readImageSize(imageDataUrl);

        await fetch("/api/entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            weekKey: week.weekKey,
            daySlot: activeDay,
            imageDataUrl,
            imageWidth: dimensions.width,
            imageHeight: dimensions.height,
          }),
        });

        setIsPasting(false);
        await loadWeek();
      };

      reader.readAsDataURL(file);
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeDay, week]);

  useEffect(() => {
    if (!week) {
      return;
    }

    const processingIds = week.entries
      .filter((entry) => entry.status === "processing")
      .map((entry) => entry.id);

    if (processingIds.length === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      void Promise.all(processingIds.map((id) => fetch(`/api/entries/${id}`)))
        .then((responses) => Promise.all(responses.map((response) => response.json())))
        .then((entries: WeekEntry[]) => {
          if (entries.some((entry) => entry.status !== "processing")) {
            void loadWeek();
          }
        });
    }, 1200);

    return () => window.clearInterval(interval);
  }, [week]);

  const entriesByDay = useMemo(() => {
    if (!week) {
      return new Map<DaySlot, WeekEntry[]>();
    }

    return new Map<DaySlot, WeekEntry[]>(
      dayGroups.map(([slot]) => [
        slot,
        week.entries.filter((entry) => entry.daySlot === slot),
      ]),
    );
  }, [week]);

  async function loadWeek() {
    const response = await fetch(`/api/weeks/offset-${weekOffset}`);
    const data = (await response.json()) as WeekData;
    setWeek(data);
  }

  async function handleDeleteTerm(termId: string) {
    await fetch(`/api/entry-terms/${termId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "delete" }),
    });

    await loadWeek();
  }

  async function handleSaveNote() {
    if (!week) {
      return;
    }

    const response = await fetch(`/api/weeks/${week.weekKey}/note`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: noteDraft }),
    });

    const updated = (await response.json()) as WeekData;
    setWeek(updated);
  }

  if (!week) {
    return (
      <main className="app-shell">
        <section className="board board-loading">正在加载本周手帐...</section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <section className="board">
        <header className="topbar">
          <div className="title-block">
            <h1>Week {week.weekNumber}</h1>
            <p className="date-range">{week.label}</p>
          </div>
          <div className="week-actions">
            <button
              className="nav-button"
              onClick={() => setWeekOffset((value) => value - 1)}
            >
              上一周
            </button>
            <button
              className="today-button"
              onClick={() => setWeekOffset(0)}
            >
              Today
            </button>
            <button
              className="nav-button"
              onClick={() => setWeekOffset((value) => value + 1)}
            >
              下一周
            </button>
          </div>
        </header>

        <section className="canvas-shell">
          <aside className="canvas-sidebar">
            <p className="sidebar-label">当前模式</p>
            <strong>关键词手帐</strong>
            <p className="sidebar-copy">
              直接在页面里粘贴截图。当前贴图目标是
              <span> {labelForDay(activeDay)}</span>。
            </p>
            <div className="sidebar-pills">
              <span>{isPasting ? "正在贴图" : "等待粘贴"}</span>
              <span>长图视图</span>
            </div>
          </aside>

          <section className="week-grid">
            <div className="week-row">
              {dayGroups.slice(0, 3).map(([slot, label]) => (
                <DayColumn
                  key={slot}
                  dayLabel={label}
                  daySlot={slot}
                  dayNumber={week.dayNumbers[slot]}
                  isActive={activeDay === slot}
                  onActivate={setActiveDay}
                  onDeleteTerm={handleDeleteTerm}
                  entries={entriesByDay.get(slot) ?? []}
                />
              ))}
            </div>

            <div className="week-row">
              {dayGroups.slice(3).map(([slot, label]) => (
                <DayColumn
                  key={slot}
                  dayLabel={label}
                  daySlot={slot}
                  dayNumber={week.dayNumbers[slot]}
                  isActive={activeDay === slot}
                  onActivate={setActiveDay}
                  onDeleteTerm={handleDeleteTerm}
                  entries={entriesByDay.get(slot) ?? []}
                  isWeekend={slot === "weekend"}
                />
              ))}
            </div>
          </section>
        </section>

        <section className="notes-panel">
          <div className="notes-header">
            <span>NOTES</span>
            <span className="notes-meta">
              {isPasting ? "正在贴图..." : `当前贴图列: ${labelForDay(activeDay)}`}
            </span>
          </div>
          <textarea
            className="notes-textarea"
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
          />
          <div className="notes-actions">
            <button
              className="today-button"
              onClick={() => void handleSaveNote()}
            >
              保存本周笔记
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

function DayColumn({
  daySlot,
  dayNumber,
  dayLabel,
  entries,
  isActive,
  onActivate,
  onDeleteTerm,
  isWeekend = false,
}: {
  daySlot: DaySlot;
  dayNumber: string;
  dayLabel: string;
  entries: WeekEntry[];
  isActive: boolean;
  onActivate: (day: DaySlot) => void;
  onDeleteTerm: (termId: string) => void;
  isWeekend?: boolean;
}) {
  return (
    <section
      className={`day-column ${isWeekend ? "day-column-weekend" : ""} ${
        isActive ? "day-column-active" : ""
      }`}
      onClick={() => onActivate(daySlot)}
    >
      <header className="day-header">
        <div>
          <div className="day-number">{dayNumber}</div>
          <div className="day-name">{dayLabel}</div>
        </div>
        {isActive ? <span className="day-active-chip">贴图目标</span> : null}
      </header>
      <div className="entry-stack">
        {entries.map((entry, index) => (
          <motion.article
            key={entry.id}
            className={`entry-card entry-card-${entry.status}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            style={{ rotate: entryRotation(index) }}
          >
            <div className={`tape tape-${entry.decorationStyle}`} />
            <div className={`pin pin-${entry.decorationStyle}`} />
            <div className="image-frame">
              <img
                className="entry-image"
                src={entry.imageUrl}
                alt={entry.title}
              />
            </div>
            <div className="entry-caption">
              <strong>{entry.title}</strong>
              <span>{statusLabel(entry)}</span>
            </div>
            <div className="term-cluster">
              {visibleTerms(entry).length > 0 ? (
                <div className="term-summary">
                  <button
                    className="term-pill primary"
                    onClick={(event) => {
                      event.stopPropagation();
                      void navigator.clipboard.writeText(visibleTerms(entry)[0].term);
                    }}
                  >
                    {visibleTerms(entry)[0].term}
                    {visibleTerms(entry).length > 1 ? (
                      <span className="term-count">+{visibleTerms(entry).length - 1}</span>
                    ) : null}
                  </button>
                  <div className="term-hover-list">
                    {visibleTerms(entry).map((term) => (
                      <button
                        key={term.id}
                        className="term-pill floating"
                        onClick={(event) => {
                          event.stopPropagation();
                          void navigator.clipboard.writeText(term.term);
                        }}
                      >
                        <span>{term.term}</span>
                        <span
                          className="term-delete"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void onDeleteTerm(term.id);
                          }}
                        >
                          ×
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="processing-copy">
                  {entry.status === "failed"
                    ? entry.errorMessage ?? "处理失败"
                    : "正在把感觉翻译成设计语言..."}
                </span>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function labelForDay(day: DaySlot) {
  return {
    mon: "周一",
    tue: "周二",
    wed: "周三",
    thu: "周四",
    fri: "周五",
    weekend: "周末",
  }[day];
}

function statusLabel(entry: WeekEntry) {
  if (entry.status === "processing") {
    return "AI 正在提词";
  }

  if (entry.status === "failed") {
    return "生成失败";
  }

  return "术语已生成";
}

function visibleTerms(entry: WeekEntry) {
  return entry.terms.filter((term) => !term.deletedAt);
}

function entryRotation(index: number) {
  const angles = [-3, 2, -1, 3, -2];
  return angles[index % angles.length];
}

async function readImageSize(imageDataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.width,
        height: image.height,
      });
    };
    image.src = imageDataUrl;
  });
}
