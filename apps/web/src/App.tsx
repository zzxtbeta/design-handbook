import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DaySlot,
  ReactorBoard,
  ReactorDay,
  ReactorMaterialType,
  WeekData,
  WeekEntry,
} from "./types";

const dayGroups = [
  ["mon", "周一"],
  ["tue", "周二"],
  ["wed", "周三"],
  ["thu", "周四"],
  ["fri", "周五"],
  ["weekend", "周末"],
] as const;

type ViewMode = "week" | "day";
type BoardMode = "aesthetic" | "reactor";

interface BoardLayout {
  x: number;
  y: number;
  width: number;
  z: number;
}

type WeekCardSizes = Record<string, number>;

interface ReactorPet {
  id: string;
  rarity: "common" | "rare" | "legendary";
  bubble: "cloud" | "notch" | "soft" | "ticket" | "star";
  mode: "peek" | "perch" | "float";
  species: "fox" | "sprout" | "moth" | "slime" | "pup" | "owl";
  palette: [string, string, string];
}

const reactorPets: ReactorPet[] = [
  { id: "mochi", rarity: "common", bubble: "cloud", mode: "peek", species: "slime", palette: ["#f1dfb6", "#d8bd7a", "#513927"] },
  { id: "mint", rarity: "common", bubble: "soft", mode: "perch", species: "sprout", palette: ["#d2e7c8", "#90b77d", "#41563a"] },
  { id: "pebble", rarity: "common", bubble: "ticket", mode: "peek", species: "pup", palette: ["#e1d2c5", "#bc8d63", "#5a3f31"] },
  { id: "pip", rarity: "common", bubble: "notch", mode: "float", species: "moth", palette: ["#ead8ee", "#b291cc", "#523e63"] },
  { id: "lulu", rarity: "common", bubble: "cloud", mode: "perch", species: "fox", palette: ["#f6d9cb", "#d47e66", "#5f372f"] },
  { id: "bobo", rarity: "common", bubble: "soft", mode: "peek", species: "owl", palette: ["#d9d9ef", "#8f90c6", "#404069"] },
  { id: "pico", rarity: "common", bubble: "ticket", mode: "float", species: "slime", palette: ["#d4e3db", "#82ab96", "#355346"] },
  { id: "toto", rarity: "common", bubble: "star", mode: "peek", species: "pup", palette: ["#f2dfc8", "#ca9f6a", "#614734"] },
  { id: "nori", rarity: "common", bubble: "cloud", mode: "float", species: "moth", palette: ["#d4ebe3", "#87b3a6", "#365249"] },
  { id: "mugi", rarity: "common", bubble: "notch", mode: "perch", species: "fox", palette: ["#f0deb1", "#d19b4f", "#66461f"] },
  { id: "yuzu", rarity: "common", bubble: "soft", mode: "float", species: "sprout", palette: ["#f4e6b7", "#d8b85c", "#63512a"] },
  { id: "kiki", rarity: "common", bubble: "star", mode: "perch", species: "owl", palette: ["#e0d5eb", "#a88dbe", "#4b3f60"] },
  { id: "momo", rarity: "rare", bubble: "cloud", mode: "float", species: "fox", palette: ["#ffd7e3", "#ea8da8", "#65364a"] },
  { id: "sumi", rarity: "rare", bubble: "ticket", mode: "perch", species: "pup", palette: ["#dce4ef", "#89a6c9", "#334b63"] },
  { id: "puff", rarity: "rare", bubble: "soft", mode: "peek", species: "slime", palette: ["#ece6ff", "#b9a6ff", "#51426e"] },
  { id: "beta", rarity: "rare", bubble: "star", mode: "float", species: "moth", palette: ["#daf4e4", "#7cc79b", "#2e5b44"] },
  { id: "nova", rarity: "legendary", bubble: "notch", mode: "float", species: "sprout", palette: ["#ffe7a8", "#f7b63f", "#77531d"] },
  { id: "gigi", rarity: "legendary", bubble: "cloud", mode: "perch", species: "owl", palette: ["#fff0b9", "#f3c44d", "#70541e"] },
];

export function App() {
  const [week, setWeek] = useState<WeekData | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeDay, setActiveDay] = useState<DaySlot>("mon");
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [boardMode, setBoardMode] = useState<BoardMode>("aesthetic");
  const [appearance, setAppearance] = useState<"light" | "dark">("light");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reactorBoard, setReactorBoard] = useState<ReactorBoard | null>(null);
  const [reactorLoading, setReactorLoading] = useState(false);
  const [reactorError, setReactorError] = useState<string | null>(null);
  const [reactorViewMode, setReactorViewMode] = useState<ViewMode>("week");
  const [activeReactorDayKey, setActiveReactorDayKey] = useState(todayDateKey());
  const [reactorLayouts, setReactorLayouts] = useState<Record<string, BoardLayout>>({});
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerType, setComposerType] = useState<ReactorMaterialType>("diary");
  const [composerDayKey, setComposerDayKey] = useState(todayDateKey());
  const [composerContent, setComposerContent] = useState("");
  const [composerNote, setComposerNote] = useState("");
  const [composerTagsDraft, setComposerTagsDraft] = useState("");
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [dayNoteDraft, setDayNoteDraft] = useState("");
  const [notesHeight, setNotesHeight] = useState(250);
  const [boardLayouts, setBoardLayouts] = useState<Record<string, BoardLayout>>({});
  const [weekCardSizes, setWeekCardSizes] = useState<WeekCardSizes>({});
  const [copiedTerm, setCopiedTerm] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [zoomedEntry, setZoomedEntry] = useState<WeekEntry | null>(null);
  const [processingStage, setProcessingStage] = useState("Preparing image...");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void loadWeek();
  }, [weekOffset]);

  useEffect(() => {
    if (boardMode !== "reactor") {
      return;
    }

    if (reactorBoard) {
      return;
    }

    void loadReactorBoard();
  }, [boardMode, reactorBoard]);

  useEffect(() => {
    if (!week) {
      return;
    }

    setNoteDraft(week.note);
    setDayNoteDraft(week.dayNotes[activeDay] ?? "");
  }, [week]);

  useEffect(() => {
    if (!week) {
      return;
    }

    const storageKey = layoutStorageKey(week.weekKey, activeDay);
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as Record<string, BoardLayout>) : {};
    const entries = week.entries.filter((entry) => entry.daySlot === activeDay);
    const merged = { ...parsed };

    entries.forEach((entry, index) => {
      if (!merged[entry.id]) {
        merged[entry.id] = defaultBoardLayout(entry, index);
      }
    });

    setBoardLayouts(merged);
  }, [activeDay, week]);

  useEffect(() => {
    if (!week) {
      return;
    }

    const raw = window.localStorage.getItem(weekCardStorageKey(week.weekKey));
    setWeekCardSizes(raw ? (JSON.parse(raw) as WeekCardSizes) : {});
  }, [week]);

  useEffect(() => {
    if (!week || Object.keys(boardLayouts).length === 0) {
      return;
    }

    window.localStorage.setItem(
      layoutStorageKey(week.weekKey, activeDay),
      JSON.stringify(boardLayouts),
    );
  }, [activeDay, boardLayouts, week]);

  useEffect(() => {
    if (!week) {
      return;
    }

    window.localStorage.setItem(weekCardStorageKey(week.weekKey), JSON.stringify(weekCardSizes));
  }, [week, weekCardSizes]);

  useEffect(() => {
    const activeMaterials =
      reactorBoard?.days.find((day) => day.dayKey === activeReactorDayKey)?.materials ?? [];
    if (activeMaterials.length === 0) {
      setReactorLayouts({});
      return;
    }

    const raw = window.localStorage.getItem(reactorLayoutStorageKey(activeReactorDayKey));
    const parsed = raw ? (JSON.parse(raw) as Record<string, BoardLayout>) : {};
    const merged = { ...parsed };

    activeMaterials.forEach((material, index) => {
      if (!merged[material.id]) {
        merged[material.id] = defaultReactorLayout(index);
      }
    });

    setReactorLayouts(merged);
  }, [activeReactorDayKey, reactorBoard]);

  useEffect(() => {
    if (Object.keys(reactorLayouts).length === 0) {
      return;
    }

    window.localStorage.setItem(
      reactorLayoutStorageKey(activeReactorDayKey),
      JSON.stringify(reactorLayouts),
    );
  }, [activeReactorDayKey, reactorLayouts]);

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
        await submitImage(imageDataUrl);
      };

      reader.readAsDataURL(file);
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeDay, week]);

  useEffect(() => {
    const activeProcessingCount = week
      ? week.entries.filter((entry) => entry.status === "processing").length
      : 0;

    if (!isPasting && activeProcessingCount === 0) {
      return;
    }

    const stages = [
      "Preparing image...",
      "Uploading snapshot...",
      "Reading layout cues...",
      "Extracting design language...",
    ];
    let index = 0;
    setProcessingStage(stages[0]);

    const interval = window.setInterval(() => {
      index = Math.min(index + 1, stages.length - 1);
      setProcessingStage(stages[index]);
    }, 900);

    return () => window.clearInterval(interval);
  }, [isPasting, week]);

  useEffect(() => {
    if (!week) {
      return;
    }

    setDayNoteDraft(week.dayNotes[activeDay] ?? "");
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

  useEffect(() => {
    if (!copiedTerm) {
      return;
    }

    const timeout = window.setTimeout(() => setCopiedTerm(null), 1400);
    return () => window.clearTimeout(timeout);
  }, [copiedTerm]);

  useEffect(() => {
    function closeExpandedTerms() {
      setExpandedEntryId(null);
    }

    window.addEventListener("click", closeExpandedTerms);
    return () => window.removeEventListener("click", closeExpandedTerms);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = appearance;
  }, [appearance]);

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

  const reactorWeek = useMemo(
    () => buildReactorWeek(reactorBoard?.days ?? []),
    [reactorBoard],
  );
  const activeReactorDay = reactorWeek.get(reactorSlotForDate(activeReactorDayKey));
  const activeReactorMaterials =
    reactorBoard?.days.find((day) => day.dayKey === activeReactorDayKey)?.materials ?? [];

  const activeEntries = week
    ? week.entries.filter((entry) => entry.daySlot === activeDay)
    : [];
  const processingCount = week ? week.entries.filter((entry) => entry.status === "processing").length : 0;
  const weeklySummary = useMemo(() => buildWeeklySummary(week), [week]);

  async function loadWeek() {
    try {
      const response = await fetch(`/api/weeks/offset-${weekOffset}`);

      if (!response.ok) {
        throw new Error(`Week load failed with status ${response.status}`);
      }

      const data = (await response.json()) as WeekData;
      setWeek(data);
      setLoadError(null);
    } catch (error) {
      console.error("[web] loadWeek failed", error);
      setLoadError("Aesthetic Board 暂时读不到数据，Reactor 仍然可以先看方向。");
      setWeek(null);
    }
  }

  async function loadReactorBoard() {
    try {
      setReactorLoading(true);
      const response = await fetch("/api/reactor/days?days=7");

      if (!response.ok) {
        throw new Error(`Reactor load failed with status ${response.status}`);
      }

      const data = (await response.json()) as ReactorBoard;
      setReactorBoard(data);
      setReactorError(null);
    } catch (error) {
      console.error("[web] loadReactorBoard failed", error);
      setReactorError("Creator Reactor 暂时读不到数据。");
    } finally {
      setReactorLoading(false);
    }
  }

  function openComposer(type: ReactorMaterialType, dayKey = activeReactorDayKey) {
    setComposerType(type);
    setComposerDayKey(dayKey);
    setIsComposerOpen(true);
  }

  async function handleSaveMaterial() {
    if (composerContent.trim() === "") {
      return;
    }

    try {
      setIsSavingMaterial(true);
      const response = await fetch("/api/reactor/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dayKey: composerDayKey,
          type: composerType,
          content: composerContent,
          note: composerNote,
          manualTags: composerTagsDraft
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error(`Reactor create failed with status ${response.status}`);
      }

      setComposerContent("");
      setComposerNote("");
      setComposerTagsDraft("");
      setIsComposerOpen(false);
      await loadReactorBoard();
    } catch (error) {
      console.error("[web] handleSaveMaterial failed", error);
      setReactorError("保存素材失败，请稍后重试。");
    } finally {
      setIsSavingMaterial(false);
    }
  }

  async function handleDeleteMaterial(materialId: string) {
    try {
      await fetch(`/api/reactor/materials/${materialId}`, {
        method: "DELETE",
      });
      await loadReactorBoard();
    } catch (error) {
      console.error("[web] handleDeleteMaterial failed", error);
      setReactorError("删除素材失败，请稍后重试。");
    }
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

  async function handleDeleteEntry(entryId: string) {
    await fetch(`/api/entries/${entryId}`, {
      method: "DELETE",
    });

    setBoardLayouts((current) => {
      const next = { ...current };
      delete next[entryId];
      return next;
    });

    await loadWeek();
  }

  async function handleMoveEntryToDay(entryId: string, daySlot: DaySlot) {
    await fetch(`/api/entries/${entryId}/day-slot`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ daySlot }),
    });

    setActiveDay(daySlot);
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

  async function handleSaveDayNote() {
    if (!week) {
      return;
    }

    const response = await fetch(`/api/weeks/${week.weekKey}/day-notes/${activeDay}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: dayNoteDraft }),
    });

    const updated = (await response.json()) as WeekData;
    setWeek(updated);
  }

  async function handleCopyTerm(term: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(term);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = term;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = term;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopiedTerm(term);
  }

  async function submitImage(imageDataUrl: string) {
    if (!week) {
      return;
    }

    setIsPasting(true);
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
  }

  function handleUpdateLayout(entryId: string, next: Partial<BoardLayout>) {
    setBoardLayouts((current) => ({
      ...current,
      [entryId]: {
        ...(current[entryId] ?? defaultBoardLayout(activeEntries[0], 0)),
        ...next,
      },
    }));
  }

  function handleUpdateWeekCardSize(entryId: string, width: number) {
    setWeekCardSizes((current) => ({
      ...current,
      [entryId]: width,
    }));
  }

  function handleFocusTodayBoard() {
    setWeekOffset(0);
    setActiveDay(todaySlot());
    setViewMode("day");
  }

  return (
    <main className={`app-shell app-shell-${appearance}`}>
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <section className="board">
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            const reader = new FileReader();
            reader.onload = async () => {
              await submitImage(String(reader.result ?? ""));
              event.target.value = "";
            };
            reader.readAsDataURL(file);
          }}
        />
        <header className="topbar">
          <div className="title-block">
            <h1>
              {boardMode === "aesthetic"
                ? week
                  ? `Week ${week.weekNumber}`
                  : "Aesthetic Board"
                : "Creator Reactor"}
            </h1>
            <p className="date-range">
              {boardMode === "aesthetic"
                ? week?.label ?? "Visual references, mood, and interface language."
                : "A daily whiteboard for loose notes, links, prompts, and unfinished thoughts."}
            </p>
          </div>
          <div className="week-actions">
            <div className="week-actions-top">
              <div className="board-mode-switch">
                <button
                  className={`top-tool ${boardMode === "aesthetic" ? "active" : ""}`}
                  onClick={() => setBoardMode("aesthetic")}
                >
                  <span className="top-tool-icon">◫</span>
                  <span>Aesthetic Board</span>
                </button>
                <button
                  className={`top-tool ${boardMode === "reactor" ? "active" : ""}`}
                  onClick={() => setBoardMode("reactor")}
                >
                  <span className="top-tool-icon">✎</span>
                  <span>Reactor</span>
                </button>
              </div>
              {boardMode === "aesthetic" ? (
                <>
                  <button className="nav-button icon-only" onClick={() => setWeekOffset((value) => value - 1)}>
                    ‹
                  </button>
                  <button className="today-button" onClick={handleFocusTodayBoard}>
                    {week ? `Week ${week.weekNumber}` : "Open Board"}
                  </button>
                  <button className="nav-button icon-only" onClick={() => setWeekOffset((value) => value + 1)}>
                    ›
                  </button>
                  <button className="top-tool active" onClick={() => setShowSummary(true)}>
                    <span className="top-tool-icon">◫</span>
                    <span>Weekly Summary</span>
                  </button>
                </>
              ) : null}
              <button
                className="top-tool icon-tool"
                onClick={() => setAppearance((current) => (current === "light" ? "dark" : "light"))}
                aria-label="切换明暗主题"
              >
                ☾
              </button>
            </div>
          </div>
        </header>

        <section className="view-switcher">
          <span className="view-copy">
            {boardMode === "aesthetic"
              ? viewMode === "week"
                ? "Weekly Board"
                : `Focused ${labelForDay(activeDay)}`
              : "Daily whiteboards for unfinished thoughts"}
          </span>
          {copiedTerm ? <span className="copied-inline">已复制</span> : null}
        </section>

        <motion.section
          className="paper-sheet"
          animate={{
            filter: showSummary || processingCount > 0 ? "blur(8px)" : "blur(0px)",
          }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <AnimatePresence mode="wait">
            {boardMode === "aesthetic" ? (
              !week ? (
                <BoardUnavailable
                  message={loadError ?? "正在加载本周手帐..."}
                  onOpenReactor={() => setBoardMode("reactor")}
                  onRetry={() => void loadWeek()}
                />
              ) : viewMode === "week" ? (
                <motion.div
                  key="week-view"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.03 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  style={{ transformOrigin: focusOrigin(activeDay) }}
                >
              <section className="week-grid">
                <div className="week-row">
                  {dayGroups.slice(0, 3).map(([slot, label]) => (
                    <DayColumn
                      key={slot}
                      dayLabel={label}
                      daySlot={slot}
                      dayNumber={week.dayNumbers[slot]}
                      isActive={activeDay === slot}
                      onOpenDay={(day) => {
                        setActiveDay(day);
                        setViewMode("day");
                      }}
                      onSelectDay={setActiveDay}
                      onDeleteTerm={handleDeleteTerm}
                      onDeleteEntry={handleDeleteEntry}
                      onMoveEntry={handleMoveEntryToDay}
                      onCopyTerm={handleCopyTerm}
                      onOpenImage={setZoomedEntry}
                      weekCardSizes={weekCardSizes}
                      onResizeCard={handleUpdateWeekCardSize}
                      expandedEntryId={expandedEntryId}
                      onToggleExpandedEntry={setExpandedEntryId}
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
                      onOpenDay={(day) => {
                        setActiveDay(day);
                        setViewMode("day");
                      }}
                      onSelectDay={setActiveDay}
                      onDeleteTerm={handleDeleteTerm}
                      onDeleteEntry={handleDeleteEntry}
                      onMoveEntry={handleMoveEntryToDay}
                      onCopyTerm={handleCopyTerm}
                      onOpenImage={setZoomedEntry}
                      weekCardSizes={weekCardSizes}
                      onResizeCard={handleUpdateWeekCardSize}
                      expandedEntryId={expandedEntryId}
                      onToggleExpandedEntry={setExpandedEntryId}
                      entries={entriesByDay.get(slot) ?? []}
                      isWeekend={slot === "weekend"}
                    />
                  ))}
                </div>
              </section>

              <section className="notes-panel">
                <div className="notes-header">
                  <span>NOTES</span>
                  <span className="notes-meta">
                    {isPasting ? "正在贴图..." : `当前贴图列: ${labelForDay(activeDay)}`}
                  </span>
                </div>
                <button
                  className="notes-resize-handle"
                  aria-label="调整笔记高度"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    const startY = event.clientY;
                    const startHeight = notesHeight;

                    const handleMove = (moveEvent: MouseEvent) => {
                      const nextHeight = Math.max(
                        180,
                        Math.min(520, startHeight + (moveEvent.clientY - startY)),
                      );
                      setNotesHeight(nextHeight);
                    };

                    const handleUp = () => {
                      window.removeEventListener("mousemove", handleMove);
                      window.removeEventListener("mouseup", handleUp);
                    };

                    window.addEventListener("mousemove", handleMove);
                    window.addEventListener("mouseup", handleUp);
                  }}
                >
                  <span />
                </button>
                <textarea
                  className="notes-textarea"
                  style={{ minHeight: `${notesHeight}px` }}
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                />
                <div className="notes-actions">
                  <div className="notes-inline-actions">
                    <button className="ghost-action" onClick={() => setShowSummary(true)}>周总结</button>
                  </div>
                  <button className="today-button" onClick={() => void handleSaveNote()}>
                    保存本周笔记
                  </button>
                </div>
              </section>
                </motion.div>
              ) : (
                <motion.div
                  key="day-view"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  style={{ transformOrigin: focusOrigin(activeDay) }}
                >
                  <DayCanvas
                    dayLabel={labelForDay(activeDay)}
                    dayNumber={week.dayNumbers[activeDay]}
                    entries={activeEntries}
                    layouts={boardLayouts}
                    onBack={() => setViewMode("week")}
                    dayNoteDraft={dayNoteDraft}
                    onDayNoteChange={setDayNoteDraft}
                    onSaveDayNote={() => void handleSaveDayNote()}
                    onDeleteTerm={handleDeleteTerm}
                    onDeleteEntry={handleDeleteEntry}
                    onCopyTerm={handleCopyTerm}
                    onOpenImage={setZoomedEntry}
                    expandedEntryId={expandedEntryId}
                    onToggleExpandedEntry={setExpandedEntryId}
                    onUpdateLayout={handleUpdateLayout}
                  />
                </motion.div>
              )
            ) : (
              <motion.div
                key="reactor-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                <ReactorBoardView
                  week={reactorWeek}
                  activeDayKey={activeReactorDayKey}
                  activeDay={activeReactorDay}
                  activeMaterials={activeReactorMaterials}
                  viewMode={reactorViewMode}
                  layouts={reactorLayouts}
                  isLoading={reactorLoading}
                  error={reactorError}
                  isComposerOpen={isComposerOpen}
                  composerDayKey={composerDayKey}
                  composerType={composerType}
                  composerContent={composerContent}
                  composerNote={composerNote}
                  composerTagsDraft={composerTagsDraft}
                  isSavingMaterial={isSavingMaterial}
                  onRetry={() => void loadReactorBoard()}
                  onOpenComposer={openComposer}
                  onDeleteMaterial={(id) => void handleDeleteMaterial(id)}
                  onOpenDay={(dayKey) => {
                    setActiveReactorDayKey(dayKey);
                    setReactorViewMode("day");
                  }}
                  onBackToWeek={() => setReactorViewMode("week")}
                  onCloseComposer={() => setIsComposerOpen(false)}
                  onComposerTypeChange={setComposerType}
                  onComposerContentChange={setComposerContent}
                  onComposerNoteChange={setComposerNote}
                  onComposerTagsChange={setComposerTagsDraft}
                  onSaveMaterial={() => void handleSaveMaterial()}
                  onUpdateLayout={(materialId, next) =>
                    setReactorLayouts((current) => ({
                      ...current,
                      [materialId]: {
                        ...(current[materialId] ?? defaultReactorLayout(0)),
                        ...next,
                      },
                    }))
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <AnimatePresence>
          {(isPasting || processingCount > 0) && (
            <motion.div
              className="processing-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="processing-modal"
                initial={{ scale: 0.92, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 10 }}
              >
                <div className="processing-orb">✦</div>
                <strong>{processingStage}</strong>
                <div className="processing-bar">
                  <motion.span
                    animate={{ x: ["-30%", "110%"] }}
                    transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {zoomedEntry ? (
            <motion.div
              className="image-lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedEntry(null)}
            >
              <motion.section
                className="image-lightbox-card"
                initial={{ scale: 0.94, y: 18 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.98, y: 10 }}
                onClick={(event) => event.stopPropagation()}
              >
                <button className="image-lightbox-close" onClick={() => setZoomedEntry(null)}>
                  ×
                </button>
                <img className="image-lightbox-img" src={zoomedEntry.imageUrl} alt={zoomedEntry.title} />
                <div className="image-lightbox-meta">
                  <div className="image-lightbox-title">{zoomedEntry.title}</div>
                  {zoomedEntry.promptSummary ? (
                    <button
                      className="image-lightbox-prompt"
                      onClick={() => void handleCopyTerm(zoomedEntry.promptSummary ?? "")}
                      title="点击复制风格备注"
                    >
                      <span className="image-lightbox-prompt-copy">
                        <strong>风格备注</strong>
                        <span>{zoomedEntry.promptSummary}</span>
                      </span>
                      <span className="summary-copy">⧉</span>
                    </button>
                  ) : null}
                </div>
              </motion.section>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {showSummary && week ? (
            <motion.div
              className="summary-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSummary(false)}
            >
              <motion.section
                className="summary-card"
                initial={{ scale: 0.9, y: 28 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                onClick={(event) => event.stopPropagation()}
              >
                <button className="summary-close" onClick={() => setShowSummary(false)}>
                  ×
                </button>
                <h2>Week {week.weekNumber} Summary</h2>
                <p>{week.label}</p>
                <div className="summary-stats">
                  <div>
                    <span>Total Items</span>
                    <strong>{weeklySummary.totalItems}</strong>
                  </div>
                  <div>
                    <span>Terms Found</span>
                    <strong>{weeklySummary.totalTerms}</strong>
                  </div>
                </div>
                <div className="summary-list">
                  {weeklySummary.topTerms.map((item, index) => (
                    <button
                      key={item.term}
                      className="summary-row"
                      onClick={() => void handleCopyTerm(item.term)}
                    >
                      <span className="summary-rank">{index + 1}</span>
                      <span className="summary-term">{item.term}</span>
                      <span className="summary-row-tail">
                        <span className="summary-count">{item.count}x</span>
                        <span className="summary-copy">⧉</span>
                      </span>
                    </button>
                  ))}
                </div>
              </motion.section>
            </motion.div>
          ) : null}
        </AnimatePresence>
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
  onOpenDay,
  onSelectDay,
  onDeleteTerm,
  onDeleteEntry,
  onMoveEntry,
  onCopyTerm,
  onOpenImage,
  weekCardSizes,
  onResizeCard,
  expandedEntryId,
  onToggleExpandedEntry,
  isWeekend = false,
}: {
  daySlot: DaySlot;
  dayNumber: string;
  dayLabel: string;
  entries: WeekEntry[];
  isActive: boolean;
  onOpenDay: (day: DaySlot) => void;
  onSelectDay: (day: DaySlot) => void;
  onDeleteTerm: (termId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onMoveEntry: (entryId: string, day: DaySlot) => void;
  onCopyTerm: (term: string) => void;
  onOpenImage: (entry: WeekEntry) => void;
  weekCardSizes: WeekCardSizes;
  onResizeCard: (entryId: string, width: number) => void;
  expandedEntryId: string | null;
  onToggleExpandedEntry: (entryId: string | null) => void;
  isWeekend?: boolean;
}) {
  const [isDropTarget, setIsDropTarget] = useState(false);

  return (
    <section
      className={`day-column ${isWeekend ? "day-column-weekend" : ""} ${
        isActive ? "day-column-active" : ""
      } ${isDropTarget ? "day-column-drop-target" : ""} day-column-${daySlot}`}
      onClick={() => onSelectDay(daySlot)}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDropTarget(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!isDropTarget) {
          setIsDropTarget(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDropTarget(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDropTarget(false);
        const entryId = event.dataTransfer.getData("text/entry-id");
        if (!entryId) {
          return;
        }

        onSelectDay(daySlot);
        void onMoveEntry(entryId, daySlot);
      }}
    >
      <header className="day-header">
        <button
          className="day-jump-target"
          onClick={(event) => {
            event.stopPropagation();
            onOpenDay(daySlot);
          }}
        >
          <div className="day-number">{dayNumber}</div>
          <div className="day-name">{dayLabel}</div>
        </button>
      </header>
      <div className="entry-stack">
        {entries.map((entry, index) => (
          <JournalCard
            key={entry.id}
            entry={entry}
            index={index}
            daySlot={daySlot}
            onDeleteTerm={onDeleteTerm}
            onDeleteEntry={onDeleteEntry}
            onCopyTerm={onCopyTerm}
            onOpenImage={onOpenImage}
            draggableInWeek
            resizedWidth={weekCardSizes[entry.id]}
            onResizeWidth={onResizeCard}
            isExpanded={expandedEntryId === entry.id}
            onToggleExpanded={onToggleExpandedEntry}
          />
        ))}
      </div>
    </section>
  );
}

function ReactorBoardView({
  week,
  activeDayKey,
  activeDay,
  activeMaterials,
  viewMode,
  layouts,
  isLoading,
  error,
  isComposerOpen,
  composerDayKey,
  composerType,
  composerContent,
  composerNote,
  composerTagsDraft,
  isSavingMaterial,
  onRetry,
  onOpenComposer,
  onDeleteMaterial,
  onOpenDay,
  onBackToWeek,
  onCloseComposer,
  onComposerTypeChange,
  onComposerContentChange,
  onComposerNoteChange,
  onComposerTagsChange,
  onSaveMaterial,
  onUpdateLayout,
}: {
  week: Map<DaySlot, ReactorDay>;
  activeDayKey: string;
  activeDay: ReactorDay | undefined;
  activeMaterials: ReactorDay["materials"];
  viewMode: ViewMode;
  layouts: Record<string, BoardLayout>;
  isLoading: boolean;
  error: string | null;
  isComposerOpen: boolean;
  composerDayKey: string;
  composerType: ReactorMaterialType;
  composerContent: string;
  composerNote: string;
  composerTagsDraft: string;
  isSavingMaterial: boolean;
  onRetry: () => void;
  onOpenComposer: (type: ReactorMaterialType, dayKey?: string) => void;
  onDeleteMaterial: (materialId: string) => void;
  onOpenDay: (dayKey: string) => void;
  onBackToWeek: () => void;
  onCloseComposer: () => void;
  onComposerTypeChange: (type: ReactorMaterialType) => void;
  onComposerContentChange: (value: string) => void;
  onComposerNoteChange: (value: string) => void;
  onComposerTagsChange: (value: string) => void;
  onSaveMaterial: () => void;
  onUpdateLayout: (materialId: string, next: Partial<BoardLayout>) => void;
}) {
  return viewMode === "week" ? (
    <section className="reactor-shell">
      <header className="reactor-header">
        <div>
          <p className="reactor-kicker">Weekly Reactor</p>
          <h2>Loose notes settle into the week.</h2>
        </div>
      </header>

      <section className="week-grid reactor-week-grid">
        <div className="week-row">
          {dayGroups.slice(0, 3).map(([slot, label]) => (
            <ReactorDayColumn
              key={slot}
              day={week.get(slot) ?? emptyReactorDay(slot)}
              dayLabel={label}
              onOpenDay={onOpenDay}
              onOpenComposer={onOpenComposer}
              onDeleteMaterial={onDeleteMaterial}
              isComposerOpen={
                isComposerOpen &&
                composerDayKey === (week.get(slot)?.dayKey ?? emptyReactorDay(slot).dayKey)
              }
              composerType={composerType}
              composerContent={composerContent}
              composerNote={composerNote}
              composerTagsDraft={composerTagsDraft}
              isSavingMaterial={isSavingMaterial}
              onCloseComposer={onCloseComposer}
              onComposerTypeChange={onComposerTypeChange}
              onComposerContentChange={onComposerContentChange}
              onComposerNoteChange={onComposerNoteChange}
              onComposerTagsChange={onComposerTagsChange}
              onSaveMaterial={onSaveMaterial}
            />
          ))}
        </div>
        <div className="week-row">
          {dayGroups.slice(3).map(([slot, label]) => (
            <ReactorDayColumn
              key={slot}
              day={week.get(slot) ?? emptyReactorDay(slot)}
              dayLabel={label}
              onOpenDay={onOpenDay}
              onOpenComposer={onOpenComposer}
              onDeleteMaterial={onDeleteMaterial}
              isComposerOpen={
                isComposerOpen &&
                composerDayKey === (week.get(slot)?.dayKey ?? emptyReactorDay(slot).dayKey)
              }
              composerType={composerType}
              composerContent={composerContent}
              composerNote={composerNote}
              composerTagsDraft={composerTagsDraft}
              isSavingMaterial={isSavingMaterial}
              onCloseComposer={onCloseComposer}
              onComposerTypeChange={onComposerTypeChange}
              onComposerContentChange={onComposerContentChange}
              onComposerNoteChange={onComposerNoteChange}
              onComposerTagsChange={onComposerTagsChange}
              onSaveMaterial={onSaveMaterial}
            />
          ))}
        </div>
      </section>

      {isLoading ? <p className="reactor-status">Loading daily board...</p> : null}
      {error ? (
        <div className="reactor-status reactor-status-error">
          <span>{error}</span>
          <button className="ghost-action" onClick={onRetry}>Retry</button>
        </div>
      ) : null}
    </section>
  ) : (
    <ReactorDayCanvas
      day={activeDay}
      materials={activeMaterials}
      layouts={layouts}
      isComposerOpen={isComposerOpen}
      composerType={composerType}
      composerContent={composerContent}
      composerNote={composerNote}
      composerTagsDraft={composerTagsDraft}
      isSavingMaterial={isSavingMaterial}
      onBack={onBackToWeek}
      onOpenComposer={onOpenComposer}
      onDeleteMaterial={onDeleteMaterial}
      onUpdateLayout={onUpdateLayout}
      onCloseComposer={onCloseComposer}
      onComposerTypeChange={onComposerTypeChange}
      onComposerContentChange={onComposerContentChange}
      onComposerNoteChange={onComposerNoteChange}
      onComposerTagsChange={onComposerTagsChange}
      onSaveMaterial={onSaveMaterial}
    />
  );
}

function ReactorComposer({
  compact = false,
  composerType,
  composerContent,
  composerNote,
  composerTagsDraft,
  isSavingMaterial,
  onCloseComposer,
  onComposerTypeChange,
  onComposerContentChange,
  onComposerNoteChange,
  onComposerTagsChange,
  onSaveMaterial,
}: {
  compact?: boolean;
  composerType: ReactorMaterialType;
  composerContent: string;
  composerNote: string;
  composerTagsDraft: string;
  isSavingMaterial: boolean;
  onCloseComposer: () => void;
  onComposerTypeChange: (type: ReactorMaterialType) => void;
  onComposerContentChange: (value: string) => void;
  onComposerNoteChange: (value: string) => void;
  onComposerTagsChange: (value: string) => void;
  onSaveMaterial: () => void;
}) {
  return (
    <section className={`reactor-compose-panel ${compact ? "reactor-compose-panel-compact" : ""}`}>
      <div className="reactor-compose-header">
        <strong>{labelForMaterialType(composerType)}</strong>
        <button className="ghost-action" onClick={onCloseComposer}>Close</button>
      </div>
      <div className="reactor-compose-types">
        {(["diary", "idea", "prompt", "link", "sample"] as ReactorMaterialType[]).map((type) => (
          <button
            key={type}
            className={`top-tool ${composerType === type ? "active" : ""}`}
            onClick={() => onComposerTypeChange(type)}
          >
            {labelForMaterialType(type)}
          </button>
        ))}
      </div>
      <textarea
        className="reactor-compose-textarea"
        value={composerContent}
        onChange={(event) => onComposerContentChange(event.target.value)}
        placeholder="Write the line you don't want to lose..."
      />
      <input
        className="reactor-compose-input"
        value={composerNote}
        onChange={(event) => onComposerNoteChange(event.target.value)}
        placeholder="Why keep it?"
      />
      <input
        className="reactor-compose-input"
        value={composerTagsDraft}
        onChange={(event) => onComposerTagsChange(event.target.value)}
        placeholder="tags, comma separated"
      />
      <div className="reactor-compose-actions">
        <button className="top-tool" onClick={onCloseComposer}>Cancel</button>
        <button className="today-button" onClick={onSaveMaterial} disabled={isSavingMaterial}>
          {isSavingMaterial ? "Saving..." : "Save Material"}
        </button>
      </div>
    </section>
  );
}

function ReactorDayColumn({
  day,
  dayLabel,
  onOpenDay,
  onOpenComposer,
  onDeleteMaterial,
  isComposerOpen,
  composerType,
  composerContent,
  composerNote,
  composerTagsDraft,
  isSavingMaterial,
  onCloseComposer,
  onComposerTypeChange,
  onComposerContentChange,
  onComposerNoteChange,
  onComposerTagsChange,
  onSaveMaterial,
}: {
  day: ReactorDay;
  dayLabel: string;
  onOpenDay: (dayKey: string) => void;
  onOpenComposer: (type: ReactorMaterialType, dayKey?: string) => void;
  onDeleteMaterial: (materialId: string) => void;
  isComposerOpen: boolean;
  composerType: ReactorMaterialType;
  composerContent: string;
  composerNote: string;
  composerTagsDraft: string;
  isSavingMaterial: boolean;
  onCloseComposer: () => void;
  onComposerTypeChange: (type: ReactorMaterialType) => void;
  onComposerContentChange: (value: string) => void;
  onComposerNoteChange: (value: string) => void;
  onComposerTagsChange: (value: string) => void;
  onSaveMaterial: () => void;
}) {
  const visibleMaterials = day.materials.slice(0, 3);
  const hiddenCount = Math.max(0, day.materials.length - visibleMaterials.length);
  const colonyPets = visibleMaterials.map((material) => petForMaterial(material));
  const hasLegendary = colonyPets.some((pet) => pet.rarity === "legendary");
  const hasRareEvent = hasLegendary || colonyPets.filter((pet) => pet.rarity === "rare").length >= 2;

  return (
    <section
      className={`day-column reactor-day-column ${hasRareEvent ? "reactor-day-column-event" : ""}`}
    >
      <header className="day-header reactor-day-column-header">
        <button className="day-jump-target" onClick={() => onOpenDay(day.dayKey)}>
          <div className="day-number">{formatDayKey(day.dayKey).split(" / ")[1] ?? ""}</div>
          <div className="day-name">{dayLabel}</div>
        </button>
        <button className="day-open-button" onClick={() => onOpenComposer("idea", day.dayKey)}>＋</button>
      </header>
      {colonyPets.length > 1 ? (
        <div className="reactor-day-colony" aria-hidden="true">
          {colonyPets.slice(0, 4).map((pet, index) => (
            <div
              key={`${pet.id}-${index}`}
              className={`reactor-day-colony-member reactor-day-colony-member-${index} ${
                hasRareEvent ? "reactor-day-colony-member-event" : ""
              }`}
            >
              <PixelPetSprite pet={pet} size={20} />
            </div>
          ))}
          {hasRareEvent ? <span className="reactor-day-colony-spark" /> : null}
        </div>
      ) : null}
      <div className="reactor-day-stack">
        {isComposerOpen ? (
          <ReactorComposer
            compact
            composerType={composerType}
            composerContent={composerContent}
            composerNote={composerNote}
            composerTagsDraft={composerTagsDraft}
            isSavingMaterial={isSavingMaterial}
            onCloseComposer={onCloseComposer}
            onComposerTypeChange={onComposerTypeChange}
            onComposerContentChange={onComposerContentChange}
            onComposerNoteChange={onComposerNoteChange}
            onComposerTagsChange={onComposerTagsChange}
            onSaveMaterial={onSaveMaterial}
          />
        ) : null}
        {visibleMaterials.map((material, index) => (
          <ReactorMaterialCard
            key={material.id}
            material={material}
            index={index}
            weekMode
            onDelete={() => onDeleteMaterial(material.id)}
          />
        ))}
        {hiddenCount > 0 ? (
          <button className="reactor-more-card" onClick={() => onOpenDay(day.dayKey)} aria-label="查看更多素材">
            <span className="reactor-more-stack">
              <span />
              <span />
              <span />
            </span>
            <span className="reactor-more-count">+{hiddenCount}</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ReactorDayCanvas({
  day,
  materials,
  layouts,
  isComposerOpen,
  composerType,
  composerContent,
  composerNote,
  composerTagsDraft,
  isSavingMaterial,
  onBack,
  onOpenComposer,
  onDeleteMaterial,
  onUpdateLayout,
  onCloseComposer,
  onComposerTypeChange,
  onComposerContentChange,
  onComposerNoteChange,
  onComposerTagsChange,
  onSaveMaterial,
}: {
  day: ReactorDay | undefined;
  materials: ReactorDay["materials"];
  layouts: Record<string, BoardLayout>;
  isComposerOpen: boolean;
  composerType: ReactorMaterialType;
  composerContent: string;
  composerNote: string;
  composerTagsDraft: string;
  isSavingMaterial: boolean;
  onBack: () => void;
  onOpenComposer: (type: ReactorMaterialType, dayKey?: string) => void;
  onDeleteMaterial: (materialId: string) => void;
  onUpdateLayout: (materialId: string, next: Partial<BoardLayout>) => void;
  onCloseComposer: () => void;
  onComposerTypeChange: (type: ReactorMaterialType) => void;
  onComposerContentChange: (value: string) => void;
  onComposerNoteChange: (value: string) => void;
  onComposerTagsChange: (value: string) => void;
  onSaveMaterial: () => void;
}) {
  const dayKey = day?.dayKey ?? todayDateKey();
  return (
    <section className="day-canvas">
      <header className="day-canvas-header">
        <div>
          <p className="day-canvas-kicker">Focused Day</p>
          <h2>{formatDayKey(dayKey)} · Creator Reactor</h2>
        </div>
        <div className="day-canvas-actions">
          <button className="nav-button" onClick={onBack}>Back to Week</button>
          <button className="today-button" onClick={() => onOpenComposer("diary", dayKey)}>New Note</button>
        </div>
      </header>
      <div className="day-canvas-board reactor-canvas-board">
        {isComposerOpen ? (
          <div className="reactor-canvas-composer">
            <ReactorComposer
              compact
              composerType={composerType}
              composerContent={composerContent}
              composerNote={composerNote}
              composerTagsDraft={composerTagsDraft}
              isSavingMaterial={isSavingMaterial}
              onCloseComposer={onCloseComposer}
              onComposerTypeChange={onComposerTypeChange}
              onComposerContentChange={onComposerContentChange}
              onComposerNoteChange={onComposerNoteChange}
              onComposerTagsChange={onComposerTagsChange}
              onSaveMaterial={onSaveMaterial}
            />
          </div>
        ) : null}
        {materials.map((material, index) => {
          const layout = layouts[material.id] ?? defaultReactorLayout(index);
          return (
            <motion.article
              key={material.id}
              className="day-board-card reactor-board-card"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                left: `${layout.x}px`,
                top: `${layout.y}px`,
                width: `${layout.width}px`,
                zIndex: layout.z,
                rotate: entryRotation(index),
              }}
              onMouseDown={(event) => {
                if ((event.target as HTMLElement).closest(".resize-handle, .entry-delete")) {
                  return;
                }

                const startX = event.clientX;
                const startY = event.clientY;
                const startLeft = layout.x;
                const startTop = layout.y;
                onUpdateLayout(material.id, { z: Date.now() });

                const handleMove = (moveEvent: MouseEvent) => {
                  onUpdateLayout(material.id, {
                    x: Math.max(0, startLeft + (moveEvent.clientX - startX)),
                    y: Math.max(0, startTop + (moveEvent.clientY - startY)),
                  });
                };

                const handleUp = () => {
                  window.removeEventListener("mousemove", handleMove);
                  window.removeEventListener("mouseup", handleUp);
                };

                window.addEventListener("mousemove", handleMove);
                window.addEventListener("mouseup", handleUp);
              }}
            >
              <ReactorMaterialCard
                material={material}
                index={index}
                onDelete={() => onDeleteMaterial(material.id)}
              />
              <button
                className="resize-handle resize-handle-corner"
                onMouseDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  const startX = event.clientX;
                  const startWidth = layout.width;
                  onUpdateLayout(material.id, { z: Date.now() });
                  const handleMove = (moveEvent: MouseEvent) => {
                    onUpdateLayout(material.id, {
                      width: Math.max(220, Math.min(420, startWidth + (moveEvent.clientX - startX))),
                    });
                  };
                  const handleUp = () => {
                    window.removeEventListener("mousemove", handleMove);
                    window.removeEventListener("mouseup", handleUp);
                  };
                  window.addEventListener("mousemove", handleMove);
                  window.addEventListener("mouseup", handleUp);
                }}
              />
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

function ReactorMaterialCard({
  material,
  index,
  weekMode = false,
  onDelete,
}: {
  material: ReactorDay["materials"][number];
  index: number;
  weekMode?: boolean;
  onDelete: () => void;
}) {
  const pet = petForMaterial(material);
  const weekCardStyle = weekMode ? reactorWeekCardStyle(material, index) : undefined;

  return (
    <article
      className={`reactor-card reactor-card-material reactor-card-style-${entryDecoration(index)} ${
        weekMode ? "reactor-card-week" : "reactor-card-canvas"
      } reactor-bubble-${pet.bubble} reactor-rarity-${pet.rarity}`}
      style={weekCardStyle}
    >
      <div className={`tape tape-${entryDecoration(index)}`} />
      <div className={`pin pin-${entryDecoration(index)}`} />
      <div className="paper-clip" />
      <div className={`reactor-bubble-tail reactor-bubble-tail-${pet.bubble}`} />
      <div className={`reactor-pet reactor-pet-${pet.mode} reactor-pet-rarity-${pet.rarity}`} aria-hidden="true">
        <PixelPetSprite pet={pet} size={weekMode ? 26 : 30} />
      </div>
      <button className="entry-delete" onClick={onDelete}>×</button>
      <span className="reactor-card-type">{labelForMaterialType(material.type)}</span>
      <p className="reactor-card-title">{material.content}</p>
      {material.note ? <p className="reactor-card-meta">{material.note}</p> : null}
    </article>
  );
}

function PixelPetSprite({
  pet,
  size,
}: {
  pet: ReactorPet;
  size: number;
}) {
  const pixels = spriteForPet(pet);

  return (
    <svg
      className={`reactor-pet-sprite reactor-pet-sprite-${pet.id}`}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
    >
      {pixels.map((pixel, index) => (
        <rect
          key={`${pet.id}-${index}-${pixel.x}-${pixel.y}`}
          x={pixel.x}
          y={pixel.y}
          width="1"
          height="1"
          fill={pixel.fill}
        />
      ))}
    </svg>
  );
}

function BoardUnavailable({
  message,
  onOpenReactor,
  onRetry,
}: {
  message: string;
  onOpenReactor: () => void;
  onRetry: () => void;
}) {
  return (
    <section className="board-unavailable">
      <p className="board-unavailable-kicker">Aesthetic Board</p>
      <h2>Week data is not ready yet.</h2>
      <p>{message}</p>
      <div className="board-unavailable-actions">
        <button className="today-button" onClick={onOpenReactor}>
          Open Reactor
        </button>
        <button className="top-tool" onClick={onRetry}>
          Retry
        </button>
      </div>
    </section>
  );
}

function DayCanvas({
  dayLabel,
  dayNumber,
  entries,
  layouts,
  onBack,
  dayNoteDraft,
  onDayNoteChange,
  onSaveDayNote,
  onDeleteTerm,
  onDeleteEntry,
  onCopyTerm,
  onOpenImage,
  expandedEntryId,
  onToggleExpandedEntry,
  onUpdateLayout,
}: {
  dayLabel: string;
  dayNumber: string;
  entries: WeekEntry[];
  layouts: Record<string, BoardLayout>;
  onBack: () => void;
  dayNoteDraft: string;
  onDayNoteChange: (value: string) => void;
  onSaveDayNote: () => void;
  onDeleteTerm: (termId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onCopyTerm: (term: string) => void;
  onOpenImage: (entry: WeekEntry) => void;
  expandedEntryId: string | null;
  onToggleExpandedEntry: (entryId: string | null) => void;
  onUpdateLayout: (entryId: string, next: Partial<BoardLayout>) => void;
}) {
  return (
    <section className="day-canvas">
      <header className="day-canvas-header">
        <div>
          <p className="day-canvas-kicker">Focused Day</p>
          <h2>
            {dayNumber} · {dayLabel}
          </h2>
        </div>
        <div className="day-canvas-actions">
          <button className="nav-button" onClick={onBack}>
            Back to Week
          </button>
        </div>
      </header>
      <div className="day-canvas-board">
        {entries.map((entry, index) => {
          const layout = layouts[entry.id] ?? defaultBoardLayout(entry, index);
          const ratio = imageRatio(entry);
          const cardHeight = Math.max(190, layout.width / ratio + 88);

          return (
            <motion.article
              key={entry.id}
              className="day-board-card"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                left: `${layout.x}px`,
                top: `${layout.y}px`,
                width: `${layout.width}px`,
                height: `${cardHeight}px`,
                zIndex: layout.z,
                rotate: entryRotation(index),
              }}
              onMouseDown={(event) => {
                if ((event.target as HTMLElement).closest(".resize-handle")) {
                  return;
                }

                const startX = event.clientX;
                const startY = event.clientY;
                const startLeft = layout.x;
                const startTop = layout.y;
                onUpdateLayout(entry.id, { z: Date.now() });

                const handleMove = (moveEvent: MouseEvent) => {
                  onUpdateLayout(entry.id, {
                    x: Math.max(0, startLeft + (moveEvent.clientX - startX)),
                    y: Math.max(0, startTop + (moveEvent.clientY - startY)),
                  });
                };

                const handleUp = () => {
                  window.removeEventListener("mousemove", handleMove);
                  window.removeEventListener("mouseup", handleUp);
                };

                window.addEventListener("mousemove", handleMove);
                window.addEventListener("mouseup", handleUp);
              }}
            >
              <JournalCard
                entry={entry}
                index={index}
                daySlot="mon"
                onDeleteTerm={onDeleteTerm}
                onDeleteEntry={onDeleteEntry}
                onCopyTerm={onCopyTerm}
                onOpenImage={onOpenImage}
                isExpanded={expandedEntryId === entry.id}
                onToggleExpanded={onToggleExpandedEntry}
                canvasMode
              />
              <button
                className="resize-handle resize-handle-corner"
                onMouseDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  const startX = event.clientX;
                  const startWidth = layout.width;
                  onUpdateLayout(entry.id, { z: Date.now() });

                  const handleMove = (moveEvent: MouseEvent) => {
                    onUpdateLayout(entry.id, {
                      width: Math.max(180, Math.min(420, startWidth + (moveEvent.clientX - startX))),
                    });
                  };

                  const handleUp = () => {
                    window.removeEventListener("mousemove", handleMove);
                    window.removeEventListener("mouseup", handleUp);
                  };

                  window.addEventListener("mousemove", handleMove);
                  window.addEventListener("mouseup", handleUp);
                }}
              />
              <button
                className="resize-handle resize-handle-edge"
                onMouseDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  const startX = event.clientX;
                  const startWidth = layout.width;
                  onUpdateLayout(entry.id, { z: Date.now() });

                  const handleMove = (moveEvent: MouseEvent) => {
                    onUpdateLayout(entry.id, {
                      width: Math.max(180, Math.min(420, startWidth + (moveEvent.clientX - startX))),
                    });
                  };

                  const handleUp = () => {
                    window.removeEventListener("mousemove", handleMove);
                    window.removeEventListener("mouseup", handleUp);
                  };

                  window.addEventListener("mousemove", handleMove);
                  window.addEventListener("mouseup", handleUp);
                }}
              />
            </motion.article>
          );
        })}
      </div>
      <section className="day-note-panel">
        <div className="day-note-header">
          <span>Day Notes</span>
          <button className="ghost-action" onClick={onSaveDayNote}>
            保存当日笔记
          </button>
        </div>
        <textarea
          className="day-note-textarea"
          value={dayNoteDraft}
          onChange={(event) => onDayNoteChange(event.target.value)}
          placeholder="记下今天这组灵感的感觉..."
        />
      </section>
    </section>
  );
}

function JournalCard({
  entry,
  index,
  daySlot,
  onDeleteTerm,
  onDeleteEntry,
  onCopyTerm,
  onOpenImage,
  draggableInWeek = false,
  resizedWidth,
  onResizeWidth,
  isExpanded,
  onToggleExpanded,
  canvasMode = false,
}: {
  entry: WeekEntry;
  index: number;
  daySlot: DaySlot;
  onDeleteTerm: (termId: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onCopyTerm: (term: string) => void;
  onOpenImage: (entry: WeekEntry) => void;
  draggableInWeek?: boolean;
  resizedWidth?: number;
  onResizeWidth?: (entryId: string, width: number) => void;
  isExpanded: boolean;
  onToggleExpanded: (entryId: string | null) => void;
  canvasMode?: boolean;
}) {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const canExpandSummary = (entry.promptSummary?.length ?? 0) > 58;

  return (
    <article
      className={`entry-card entry-card-${entry.status} ${canvasMode ? "entry-card-canvas" : ""} ${
        isExpanded ? "entry-card-expanded" : ""
      }`}
      style={canvasMode ? undefined : entryStyle(index, daySlot, entry, resizedWidth)}
      draggable={draggableInWeek}
      onDragStart={(event) => {
        if (!draggableInWeek) {
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/entry-id", entry.id);
      }}
    >
      <div className={`tape tape-${entry.decorationStyle}`} />
      <div className={`pin pin-${entry.decorationStyle}`} />
      <div className={`paper-clip paper-clip-${entry.decorationStyle}`} />
      <button
        className="entry-delete"
        onClick={(event) => {
          event.stopPropagation();
          void onDeleteEntry(entry.id);
        }}
      >
        ×
      </button>
      <button
        className="image-frame image-frame-button"
        onClick={(event) => {
          event.stopPropagation();
          onOpenImage(entry);
        }}
        aria-label={`放大查看 ${entry.title}`}
      >
        <img className="entry-image" src={entry.imageUrl} alt={entry.title} />
      </button>
      {entry.promptSummary ? (
        <div className={`entry-summary-chip ${isSummaryExpanded ? "entry-summary-chip-expanded" : ""}`}>
          <button
            className="entry-summary-button"
            title={entry.promptSummary}
            onClick={(event) => {
              event.stopPropagation();
              if (canExpandSummary) {
                setIsSummaryExpanded((current) => !current);
              } else {
                void onCopyTerm(entry.promptSummary ?? "");
              }
            }}
          >
            <span>{entry.promptSummary}</span>
            <span className="entry-summary-actions">
              {canExpandSummary ? (
                <span className="entry-summary-toggle">{isSummaryExpanded ? "收起" : "展开"}</span>
              ) : null}
              <span className="term-copy">⧉</span>
            </span>
          </button>
          {isSummaryExpanded ? (
            <button
              className="entry-summary-copy"
              onClick={(event) => {
                event.stopPropagation();
                void onCopyTerm(entry.promptSummary ?? "");
              }}
            >
              复制描述
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="term-cluster">
        {visibleTerms(entry).length > 0 ? (
          <div className="term-summary">
            {isExpanded ? (
              <div className="term-hover-list is-open">
                {visibleTerms(entry).map((term, termIndex) => (
                  <div key={term.id} className="term-pill-row">
                    <button
                      className="term-pill floating"
                      style={{
                        width: `${Math.max(68, 100 - termIndex * 5)}%`,
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        void onCopyTerm(term.term);
                      }}
                    >
                      <span>{term.term}</span>
                      <span className="term-copy">⧉</span>
                    </button>
                    <button
                      className="term-delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        void onDeleteTerm(term.id);
                      }}
                      aria-label={`删除术语 ${term.term}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button
                className="term-pill primary"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleExpanded(isExpanded ? null : entry.id);
                }}
              >
                <span>{visibleTerms(entry)[0].term}</span>
                {visibleTerms(entry).length > 1 ? (
                  <span className="term-count">+{visibleTerms(entry).length - 1}</span>
                ) : null}
              </button>
            )}
          </div>
        ) : (
          <span className="processing-copy">
            {entry.status === "failed"
              ? entry.errorMessage ?? "处理失败"
              : "正在把感觉翻译成设计语言..."}
          </span>
        )}
      </div>
      {!canvasMode && onResizeWidth ? (
        <button
          className="resize-handle resize-handle-week"
          onMouseDown={(event) => {
            event.stopPropagation();
            event.preventDefault();
            const startX = event.clientX;
            const startWidth = resizedWidth ?? defaultCardWidth(entry);

            const handleMove = (moveEvent: MouseEvent) => {
              onResizeWidth(entry.id, Math.max(118, Math.min(220, startWidth + (moveEvent.clientX - startX))));
            };

            const handleUp = () => {
              window.removeEventListener("mousemove", handleMove);
              window.removeEventListener("mouseup", handleUp);
            };

            window.addEventListener("mousemove", handleMove);
            window.addEventListener("mouseup", handleUp);
          }}
          aria-label="调整周视图卡片宽度"
        />
      ) : null}
    </article>
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

function todaySlot(): DaySlot {
  const day = new Date().getDay();

  if (day === 1) {
    return "mon";
  }

  if (day === 2) {
    return "tue";
  }

  if (day === 3) {
    return "wed";
  }

  if (day === 4) {
    return "thu";
  }

  if (day === 5) {
    return "fri";
  }

  return "weekend";
}

function visibleTerms(entry: WeekEntry) {
  return entry.terms.filter((term) => !term.deletedAt);
}

function entryRotation(index: number) {
  const angles = [-3, 2, -1, 3, -2];
  return angles[index % angles.length];
}

function entryStyle(index: number, daySlot: DaySlot, entry: WeekEntry, resizedWidth?: number) {
  const width = resizedWidth ?? defaultCardWidth(entry);

  return {
    transform: `rotate(${[-1.4, 0.6, -0.8, 0.8][index % 4]}deg)`,
    width: `min(100%, ${width}px)`,
  };
}

function defaultCardWidth(entry: WeekEntry) {
  const ratio = imageRatio(entry);
  return ratio > 1.25 ? 168 : ratio < 0.9 ? 150 : 160;
}

function imageRatio(entry: WeekEntry) {
  const width = entry.imageWidth ?? 280;
  const height = entry.imageHeight ?? 220;
  return width / height;
}

function defaultBoardLayout(entry: WeekEntry | undefined, index: number): BoardLayout {
  const baseWidth = entry ? Math.max(200, Math.min(340, (entry.imageWidth ?? 260) * 0.78)) : 240;
  const col = index % 3;
  const row = Math.floor(index / 3);

  return {
    x: 44 + col * 250 + (index % 2 === 0 ? 18 : -12),
    y: 72 + row * 220 + (index % 3) * 18,
    width: baseWidth,
    z: index + 1,
  };
}

function layoutStorageKey(weekKey: string, day: DaySlot) {
  return `ai-journal-layout:${weekKey}:${day}`;
}

function labelForMaterialType(type: ReactorMaterialType) {
  return {
    diary: "Diary",
    idea: "Idea",
    prompt: "Prompt",
    link: "Link",
    sample: "Sample",
  }[type];
}

function todayDateKey() {
  return localDateKey(new Date());
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfCurrentWeek() {
  const today = new Date();
  const start = new Date(today);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function buildReactorWeek(days: ReactorDay[]) {
  const start = startOfCurrentWeek();
  const byKey = new Map(days.map((day) => [day.dayKey, day]));
  const week = new Map<DaySlot, ReactorDay>();

  dayGroups.forEach(([slot], index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    if (slot === "weekend") {
      const sunday = new Date(start);
      sunday.setDate(start.getDate() + 6);
      const saturdayKey = localDateKey(date);
      const sundayKey = localDateKey(sunday);
      const materials = [
        ...(byKey.get(saturdayKey)?.materials ?? []),
        ...(byKey.get(sundayKey)?.materials ?? []),
      ];

      week.set(slot, {
        dayKey: saturdayKey,
        label: "Weekend",
        itemCount: materials.length,
        materials,
      });
      return;
    }

    const dayKey = localDateKey(date);
    week.set(slot, byKey.get(dayKey) ?? emptyReactorDay(slot));
  });

  return week;
}

function reactorSlotForDate(dayKey: string): DaySlot {
  const date = new Date(`${dayKey}T00:00:00`);
  const day = date.getDay();

  if (day === 1) return "mon";
  if (day === 2) return "tue";
  if (day === 3) return "wed";
  if (day === 4) return "thu";
  if (day === 5) return "fri";

  return "weekend";
}

function emptyReactorDay(slot: DaySlot): ReactorDay {
  const start = startOfCurrentWeek();
  const offset = slot === "weekend" ? 5 : dayGroups.findIndex(([value]) => value === slot);
  const date = new Date(start);
  date.setDate(start.getDate() + Math.max(offset, 0));

  return {
    dayKey: localDateKey(date),
    label: labelForDay(slot),
    itemCount: 0,
    materials: [],
  };
}

function reactorLayoutStorageKey(dayKey: string) {
  return `creator-reactor-layout:${dayKey}`;
}

function defaultReactorLayout(index: number): BoardLayout {
  const col = index % 3;
  const row = Math.floor(index / 3);

  return {
    x: 44 + col * 246 + (index % 2 === 0 ? 12 : -8),
    y: 82 + row * 214 + (index % 3) * 14,
    width: 258,
    z: index + 1,
  };
}

function entryDecoration(index: number) {
  const styles = ["amber", "pink", "sage", "blue"] as const;
  return styles[index % styles.length];
}

function petForMaterial(material: ReactorDay["materials"][number]) {
  const value = hashString(`${material.id}:${material.type}`);
  const bucket = value % 1000;
  const legendary = reactorPets.filter((pet) => pet.rarity === "legendary");
  const rare = reactorPets.filter((pet) => pet.rarity === "rare");
  const common = reactorPets.filter((pet) => pet.rarity === "common");

  if (bucket < 10) {
    return legendary[value % legendary.length];
  }

  if (bucket < 200) {
    return rare[value % rare.length];
  }

  return common[value % common.length];
}

function reactorWeekCardStyle(material: ReactorDay["materials"][number], index: number) {
  const contentLength = material.content.trim().length + material.note.trim().length * 0.65;
  const width = Math.max(46, Math.min(74, 50 + Math.min(contentLength, 72) * 0.2));
  const align = ["start", "center", "end"][index % 3] as "start" | "center" | "end";

  return {
    ["--reactor-card-width" as string]: `${width}%`,
    ["--reactor-card-align" as string]: align,
  };
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function spriteForPet(pet: ReactorPet) {
  const [base, accent, shade] = pet.palette;
  const eye = "#2f241f";
  const pixels: Array<{ x: number; y: number; fill: string }> = [];

  const paint = (coords: Array<[number, number]>, fill: string) => {
    coords.forEach(([x, y]) => {
      pixels.push({ x, y, fill });
    });
  };

  const speciesPixels: Record<ReactorPet["species"], Array<[number, number]>> = {
    slime: [
      [5, 3], [6, 3], [7, 3], [8, 3], [9, 3],
      [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4],
      [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5],
      [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6],
      [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7],
      [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8],
      [5, 9], [6, 9], [7, 9], [8, 9], [9, 9],
    ],
    fox: [
      [4, 2], [8, 2],
      [3, 3], [4, 3], [5, 3], [7, 3], [8, 3], [9, 3],
      [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4],
      [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5],
      [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6],
      [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7],
      [4, 8], [5, 8], [6, 8], [7, 8], [8, 8],
      [8, 9], [9, 9], [10, 9],
    ],
    sprout: [
      [7, 1], [8, 1],
      [6, 2], [7, 2], [8, 2], [9, 2],
      [6, 3], [7, 3], [8, 3], [9, 3],
      [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4],
      [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5],
      [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6],
      [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7],
      [6, 8], [7, 8], [8, 8], [9, 8],
    ],
    moth: [
      [6, 2], [9, 2],
      [4, 3], [5, 3], [6, 3], [9, 3], [10, 3], [11, 3],
      [3, 4], [4, 4], [5, 4], [6, 4], [9, 4], [10, 4], [11, 4], [12, 4],
      [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5],
      [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6],
      [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7],
      [6, 8], [7, 8], [8, 8], [9, 8],
    ],
    pup: [
      [4, 3], [8, 3],
      [3, 4], [4, 4], [5, 4], [7, 4], [8, 4], [9, 4],
      [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5],
      [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6],
      [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7],
      [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8],
      [3, 9], [8, 9],
    ],
    owl: [
      [5, 2], [8, 2],
      [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3],
      [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4],
      [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5],
      [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6],
      [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7],
      [5, 8], [6, 8], [7, 8], [8, 8],
      [4, 9], [8, 9],
    ],
  };

  const accentPixels: Partial<Record<ReactorPet["species"], Array<[number, number]>>> = {
    slime: [[5, 4], [9, 4], [6, 9], [8, 9]],
    fox: [[4, 3], [8, 3], [9, 9], [10, 9]],
    sprout: [[7, 1], [8, 1], [6, 2], [9, 2]],
    moth: [[4, 4], [11, 4], [5, 7], [10, 7]],
    pup: [[4, 3], [8, 3], [3, 9], [8, 9]],
    owl: [[5, 2], [8, 2], [4, 9], [8, 9]],
  };

  const shadePixels: Partial<Record<ReactorPet["species"], Array<[number, number]>>> = {
    slime: [[4, 7], [10, 7], [5, 8], [9, 8]],
    fox: [[3, 5], [9, 5], [4, 8], [7, 8]],
    sprout: [[5, 6], [10, 6], [6, 7], [9, 7]],
    moth: [[6, 5], [9, 5], [7, 6], [8, 6]],
    pup: [[3, 6], [9, 6], [4, 7], [8, 7]],
    owl: [[4, 5], [9, 5], [5, 7], [8, 7]],
  };

  paint(speciesPixels[pet.species], base);
  paint(accentPixels[pet.species] ?? [], accent);
  paint(shadePixels[pet.species] ?? [], shade);

  if (pet.species === "fox" || pet.species === "pup" || pet.species === "owl") {
    paint(
      [
        [5, 5],
        [8, 5],
      ],
      eye,
    );
  } else {
    paint(
      [
        [6, 5],
        [8, 5],
      ],
      eye,
    );
  }

  if (pet.rarity === "legendary") {
    paint(
      [
        [12, 2],
        [11, 3],
        [12, 4],
      ],
      "#f7d56d",
    );
  }

  return pixels;
}

function formatDayKey(dayKey: string) {
  const [, month = "", day = ""] = dayKey.split("-");
  return `${month} / ${day}`;
}

function weekCardStorageKey(weekKey: string) {
  return `ai-journal-week-card:${weekKey}`;
}

function focusOrigin(day: DaySlot) {
  return {
    mon: "17% 24%",
    tue: "50% 24%",
    wed: "83% 24%",
    thu: "17% 64%",
    fri: "50% 64%",
    weekend: "83% 64%",
  }[day];
}

function buildWeeklySummary(week: WeekData | null) {
  if (!week) {
    return {
      totalItems: 0,
      totalTerms: 0,
      topTerms: [] as Array<{ term: string; count: number }>,
    };
  }

  const counter = new Map<string, number>();
  let totalTerms = 0;

  week.entries.forEach((entry) => {
    visibleTerms(entry).forEach((term) => {
      totalTerms += 1;
      counter.set(term.term, (counter.get(term.term) ?? 0) + 1);
    });
  });

  return {
    totalItems: week.entries.length,
    totalTerms,
    topTerms: [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([term, count]) => ({ term, count })),
  };
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
