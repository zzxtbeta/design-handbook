import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DaySlot,
  ReactorBoard,
  ReactorDay,
  ReactorMaterial,
  ReactorMaterialMeta,
  ReactorMaterialType,
  WeekData,
  WeekEntry,
} from "./types";

const dayGroups = [
  ["mon", "Mon"],
  ["tue", "Tue"],
  ["wed", "Wed"],
  ["thu", "Thu"],
  ["fri", "Fri"],
  ["weekend", "Weekend"],
] as const;

const reactorQuickTags = [
  "角度",
  "参考",
  "结构",
  "语气",
  "视觉",
  "跟进",
  "主题",
  "提示词",
] as const;

const reactorWhyKeepPresets = [
  "Worth revisiting",
  "Use later",
  "Strong angle",
  "Good reference",
  "Keep the tone",
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
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingImportant, setEditingImportant] = useState(false);
  const [editingNoteDraft, setEditingNoteDraft] = useState("");
  const [editingTagsDraft, setEditingTagsDraft] = useState("");
  const [isSavingMaterialEdit, setIsSavingMaterialEdit] = useState(false);
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
    void loadReactorBoard();
  }, [boardMode, weekOffset]);

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
    const parsed = readStoredJson<Record<string, BoardLayout>>(storageKey, {});
    const entries = week.entries.filter((entry) => entry.daySlot === activeDay);
    const merged: Record<string, BoardLayout> = {};

    entries.forEach((entry, index) => {
      merged[entry.id] = parsed[entry.id] ?? defaultBoardLayout(entry, index);
    });

    setBoardLayouts(merged);
  }, [activeDay, week]);

  useEffect(() => {
    if (!week) {
      return;
    }

    const stored = readStoredJson<WeekCardSizes>(weekCardStorageKey(week.weekKey), {});
    const validIds = new Set(week.entries.map((entry) => entry.id));
    setWeekCardSizes(
      Object.fromEntries(Object.entries(stored).filter(([entryId]) => validIds.has(entryId))),
    );
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

    const parsed = readStoredJson<Record<string, BoardLayout>>(reactorLayoutStorageKey(activeReactorDayKey), {});
    const merged: Record<string, BoardLayout> = {};

    activeMaterials.forEach((material, index) => {
      merged[material.id] = parsed[material.id] ?? findOpenReactorLayout(merged, material, index);
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
    async function handlePaste(event: ClipboardEvent) {
      if (!event.clipboardData) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (isEditableTarget(target)) {
        return;
      }

      if (boardMode === "reactor" && reactorViewMode === "day") {
        const imageItem = [...event.clipboardData.items].find((item) => item.type.startsWith("image/"));
        const textValue = event.clipboardData.getData("text/plain").trim();

        if (imageItem) {
          const file = imageItem.getAsFile();
          if (!file) {
            return;
          }

          event.preventDefault();
          const reader = new FileReader();
          reader.onload = async () => {
            const imageDataUrl = String(reader.result ?? "");
            const dimensions = await readImageSize(imageDataUrl);
            await createReactorMaterialRequest({
              dayKey: activeReactorDayKey,
              type: "image",
              content: "Image",
              imageDataUrl,
              meta: {
                imageWidth: dimensions.width,
                imageHeight: dimensions.height,
              },
            });
          };
          reader.readAsDataURL(file);
          return;
        }

        if (textValue) {
          event.preventDefault();
          await createReactorMaterialRequest(
            isProbablyUrl(textValue)
              ? {
                  dayKey: activeReactorDayKey,
                  type: "link",
                  content: textValue,
                  meta: {
                    sourceUrl: normalizeUrl(textValue),
                  },
                }
              : {
                  dayKey: activeReactorDayKey,
                  type: textValue.includes("\n") ? "diary" : "idea",
                  content: textValue,
                },
          );
        }

        return;
      }

      const imageItem = [...event.clipboardData.items].find((item) => item.type.startsWith("image/"));
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
  }, [activeDay, week, boardMode, reactorViewMode, activeReactorDayKey]);

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
    () => buildReactorWeek(reactorBoard?.days ?? [], weekOffset),
    [reactorBoard, weekOffset],
  );
  const activeReactorDay = reactorWeek.get(reactorSlotForDate(activeReactorDayKey));
  const activeReactorMaterials =
    reactorBoard?.days.find((day) => day.dayKey === activeReactorDayKey)?.materials ?? [];
  const reactorMaterialsById = useMemo(
    () =>
      new Map(
        (reactorBoard?.days ?? [])
          .flatMap((day) => day.materials)
          .map((material) => [material.id, material] as const),
      ),
    [reactorBoard],
  );
  const editingMaterial = editingMaterialId ? reactorMaterialsById.get(editingMaterialId) ?? null : null;
  const activeEntries = week
    ? week.entries.filter((entry) => entry.daySlot === activeDay)
    : [];
  const processingCount = week ? week.entries.filter((entry) => entry.status === "processing").length : 0;
  const weeklySummary = useMemo(() => buildWeeklySummary(week), [week]);
  const reactorWeeklySummary = useMemo(() => buildReactorWeeklySummary(reactorBoard), [reactorBoard]);

  useEffect(() => {
    if (!reactorBoard) {
      return;
    }

    const validDayKeys = new Set(reactorBoard.days.map((day) => day.dayKey));
    if (validDayKeys.has(activeReactorDayKey)) {
      return;
    }

    setActiveReactorDayKey(
      weekOffset === 0 ? todayDateKey() : (reactorBoard.days[0]?.dayKey ?? todayDateKey()),
    );
  }, [activeReactorDayKey, reactorBoard, weekOffset]);

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
      const response = await fetch(`/api/reactor/days?days=7&offset=${weekOffset}`);

      if (!response.ok) {
        throw new Error(`Reactor load failed with status ${response.status}`);
      }

      const data = (await response.json()) as ReactorBoard;
      setReactorBoard(data);
      setReactorError(null);
    } catch (error) {
      console.error("[web] loadReactorBoard failed", error);
      setReactorError("Creator Reactor is unavailable right now.");
    } finally {
      setReactorLoading(false);
    }
  }

  function openComposer(type: ReactorMaterialType, dayKey = activeReactorDayKey) {
    setComposerType(type);
    setComposerDayKey(dayKey);
    setComposerTagsDraft(defaultMaterialTags(type).join(", "));
    setIsComposerOpen(true);
  }

  async function handleSaveMaterial() {
    if (composerContent.trim() === "") {
      return;
    }

    try {
      await createReactorMaterialRequest({
        dayKey: composerDayKey,
        type: composerType,
        content: composerContent,
        important: false,
        note: composerNote,
        manualTags: composerTagsDraft
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      setComposerContent("");
      setComposerNote("");
      setComposerTagsDraft("");
      setIsComposerOpen(false);
    } catch (error) {
      console.error("[web] handleSaveMaterial failed", error);
      setReactorError("Could not save this note. Please try again.");
    }
  }

  async function createReactorMaterialRequest(input: {
    dayKey: string;
    type: ReactorMaterialType;
    content: string;
    important?: boolean;
    note?: string;
    manualTags?: string[];
    meta?: ReactorMaterialMeta | null;
    imageDataUrl?: string;
  }) {
    setIsSavingMaterial(true);
    try {
      const response = await fetch("/api/reactor/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...input,
          important: Boolean(input.important),
          manualTags:
            input.manualTags && input.manualTags.length > 0
              ? input.manualTags
              : defaultMaterialTags(input.type),
        }),
      });

      if (!response.ok) {
        throw new Error(`Reactor create failed with status ${response.status}`);
      }

      await loadReactorBoard();
    } finally {
      setIsSavingMaterial(false);
    }
  }

  async function handleDeleteMaterial(materialId: string) {
    try {
      await fetch(`/api/reactor/materials/${materialId}`, {
        method: "DELETE",
      });
      setReactorLayouts((current) => {
        const next = { ...current };
        delete next[materialId];
        return next;
      });
      if (editingMaterialId === materialId) {
        setEditingMaterialId(null);
      }
      await loadReactorBoard();
    } catch (error) {
      console.error("[web] handleDeleteMaterial failed", error);
      setReactorError("Could not delete this note. Please try again.");
    }
  }

  function openMaterialEditor(materialId: string) {
    const material = reactorMaterialsById.get(materialId);
    if (!material) {
      return;
    }

    setEditingMaterialId(materialId);
    setEditingImportant(Boolean(material.important));
    setEditingNoteDraft(material.note ?? "");
    setEditingTagsDraft(
      (material.manualTags?.length ? material.manualTags : defaultMaterialTags(material.type)).join(", "),
    );
  }

  async function handleSaveMaterialEdit() {
    if (!editingMaterialId) {
      return;
    }

    try {
      setIsSavingMaterialEdit(true);
      const response = await fetch(`/api/reactor/materials/${editingMaterialId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          important: editingImportant,
          note: editingNoteDraft,
          manualTags: editingTagsDraft
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error(`Reactor update failed with status ${response.status}`);
      }

      setEditingMaterialId(null);
      await loadReactorBoard();
    } catch (error) {
      console.error("[web] handleSaveMaterialEdit failed", error);
      setReactorError("Could not update this note. Please try again.");
    } finally {
      setIsSavingMaterialEdit(false);
    }
  }

  function handleApplyQuickTag(tag: string) {
    const current = editingTagsDraft
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const exists = current.some((item) => item.toLowerCase() === tag.toLowerCase());
    const next = exists
      ? current.filter((item) => item.toLowerCase() !== tag.toLowerCase())
      : [...current, tag];
    setEditingTagsDraft(next.join(", "));
  }

  async function handleToggleImportant(materialId: string) {
    const material = reactorMaterialsById.get(materialId);
    if (!material) {
      return;
    }

    try {
      const response = await fetch(`/api/reactor/materials/${materialId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          important: !material.important,
        }),
      });

      if (!response.ok) {
        throw new Error(`Reactor important toggle failed with status ${response.status}`);
      }

      await loadReactorBoard();
    } catch (error) {
      console.error("[web] handleToggleImportant failed", error);
      setReactorError("Could not update importance right now.");
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
                ? week?.label ?? "Weekly Board"
                : ""}
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
              <>
                <button className="nav-button icon-only" onClick={() => setWeekOffset((value) => value - 1)}>
                  ‹
                </button>
                <button
                  className="today-button"
                  onClick={() => {
                    setWeekOffset(0);
                    if (boardMode === "aesthetic") {
                      handleFocusTodayBoard();
                    } else {
                      setReactorViewMode("week");
                      setActiveReactorDayKey(todayDateKey());
                    }
                  }}
                >
                  {week ? `Week ${week.weekNumber}` : "This Week"}
                </button>
                <button className="nav-button icon-only" onClick={() => setWeekOffset((value) => value + 1)}>
                  ›
                </button>
                <button className="top-tool active" onClick={() => setShowSummary(true)}>
                  <span className="top-tool-icon">◫</span>
                  <span>{boardMode === "aesthetic" ? "Weekly Summary" : "Weekly Digest"}</span>
                </button>
              </>
              <button
                className="top-tool icon-tool"
                onClick={() => setAppearance((current) => (current === "light" ? "dark" : "light"))}
                aria-label="Toggle theme"
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
                ? "Week View"
                : `${labelForDay(activeDay)}`
              : viewMode === "week"
                ? "Weekly Board"
                : "Focused Day"}
          </span>
          {copiedTerm ? <span className="copied-inline">Copied</span> : null}
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
                  onEditMaterial={openMaterialEditor}
                  onToggleImportant={(id) => void handleToggleImportant(id)}
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
          {editingMaterialId ? (
            <motion.div
              className="summary-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMaterialId(null)}
            >
              <motion.section
                className="reactor-edit-sheet"
                initial={{ scale: 0.92, y: 22 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 10 }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="reactor-edit-sheet-header">
                  <strong>编辑素材</strong>
                  <button className="ghost-action" onClick={() => setEditingMaterialId(null)}>关闭</button>
                </div>
                {editingMaterial ? (
                  <div className="reactor-edit-meta">
                    <span className="reactor-edit-meta-label">{labelForMaterialTypeZh(editingMaterial.type)}</span>
                    {editingMaterial.type === "link" ? (
                      <>
                        <p className="reactor-edit-content">{editingMaterial.content}</p>
                        <a
                          className="reactor-edit-link"
                          href={editingMaterial.meta?.sourceUrl ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {editingMaterial.meta?.sourceUrl ?? editingMaterial.content}
                        </a>
                      </>
                    ) : editingMaterial.type === "image" ? (
                      <button
                        className="reactor-edit-image"
                        onClick={() => window.open(editingMaterial.meta?.imageUrl, "_blank", "noopener,noreferrer")}
                        >
                          {editingMaterial.meta?.imageUrl ? (
                            <img src={editingMaterial.meta.imageUrl} alt={editingMaterial.content} />
                          ) : null}
                        <span>查看大图</span>
                      </button>
                    ) : (
                      <p className="reactor-edit-content">{editingMaterial.content}</p>
                    )}
                  </div>
                ) : null}
                <textarea
                  className="reactor-compose-textarea"
                  value={editingNoteDraft}
                  onChange={(event) => setEditingNoteDraft(event.target.value)}
                  placeholder="Add a quick note"
                />
                <div className="reactor-quick-tags">
                  {reactorWhyKeepPresets.map((preset) => (
                    <button
                      key={preset}
                      className={`top-tool ${editingNoteDraft === preset ? "active" : ""}`}
                      onClick={() => setEditingNoteDraft(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  className="reactor-compose-input"
                  value={editingTagsDraft}
                  onChange={(event) => setEditingTagsDraft(event.target.value)}
                  placeholder="Tags, comma separated"
                />
                <div className="reactor-quick-tags">
                  {reactorQuickTags.map((tag) => (
                    <button
                      key={tag}
                      className={`top-tool ${
                        editingTagsDraft.toLowerCase().includes(tag.toLowerCase()) ? "active" : ""
                      }`}
                      onClick={() => handleApplyQuickTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="reactor-compose-actions">
                  <button className="top-tool" onClick={() => setEditingMaterialId(null)}>取消</button>
                  <button className="today-button" onClick={() => void handleSaveMaterialEdit()} disabled={isSavingMaterialEdit}>
                    {isSavingMaterialEdit ? "保存中..." : "保存"}
                  </button>
                </div>
              </motion.section>
            </motion.div>
          ) : null}
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
          {showSummary && ((boardMode === "aesthetic" && week) || (boardMode === "reactor" && reactorBoard)) ? (
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
                {boardMode === "aesthetic" && week ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <h2>{reactorWeekTitle(weekOffset)}</h2>
                    <p>A quick read on what accumulated this week.</p>
                    <div className="summary-stats">
                      <div>
                        <span>Total Notes</span>
                        <strong>{reactorWeeklySummary.totalItems}</strong>
                      </div>
                      <div>
                        <span>Active Days</span>
                        <strong>{reactorWeeklySummary.activeDays}</strong>
                      </div>
                    </div>
                    <div className="summary-list">
                      {reactorWeeklySummary.topTypes.map((item, index) => (
                        <div key={item.label} className="summary-row">
                          <span className="summary-rank">{index + 1}</span>
                          <span className="summary-term">{item.label}</span>
                          <span className="summary-row-tail">
                            <span className="summary-count">{item.count}x</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
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
  onEditMaterial,
  onToggleImportant,
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
  onEditMaterial: (materialId: string) => void;
  onToggleImportant: (materialId: string) => void;
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
          <h2>Drop loose thoughts into the week.</h2>
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
              onEditMaterial={onEditMaterial}
              onToggleImportant={onToggleImportant}
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
              onEditMaterial={onEditMaterial}
              onToggleImportant={onToggleImportant}
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
      onEditMaterial={onEditMaterial}
      onToggleImportant={onToggleImportant}
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
  dock = false,
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
  onApplyNotePreset,
  onSaveMaterial,
}: {
  compact?: boolean;
  dock?: boolean;
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
  onApplyNotePreset: (value: string) => void;
  onSaveMaterial: () => void;
}) {
  return (
    <section
      className={`reactor-compose-panel ${compact ? "reactor-compose-panel-compact" : ""} ${
        dock ? "reactor-compose-panel-dock" : ""
      }`}
    >
      {dock ? <span className="reactor-dock-handle" aria-hidden="true" /> : null}
      <div className="reactor-compose-header">
        <strong>{labelForMaterialTypeZh(composerType)}</strong>
        <button className="ghost-action" onClick={onCloseComposer}>关闭</button>
      </div>
      <div className="reactor-compose-types">
        {(["diary", "idea", "prompt", "link", "sample"] as ReactorMaterialType[]).map((type) => (
          <button
            key={type}
            className={`top-tool ${composerType === type ? "active" : ""}`}
            onClick={() => onComposerTypeChange(type)}
          >
            {labelForMaterialTypeZh(type)}
          </button>
        ))}
      </div>
      <textarea
        className="reactor-compose-textarea"
        value={composerContent}
        onChange={(event) => onComposerContentChange(event.target.value)}
        placeholder={dock ? "Paste a link, image, or thought..." : "Write the line you do not want to lose."}
      />
      <input
        className="reactor-compose-input"
        value={composerNote}
        onChange={(event) => onComposerNoteChange(event.target.value)}
        placeholder="Why keep it"
      />
      <div className="reactor-quick-tags">
        {reactorWhyKeepPresets.map((preset) => (
          <button
            key={preset}
            className={`top-tool ${composerNote === preset ? "active" : ""}`}
            onClick={() => onApplyNotePreset(preset)}
          >
            {preset}
          </button>
        ))}
      </div>
      <input
        className="reactor-compose-input"
        value={composerTagsDraft}
        onChange={(event) => onComposerTagsChange(event.target.value)}
        placeholder="Tags, comma separated"
      />
      <div className="reactor-compose-actions">
        <button className="top-tool" onClick={onCloseComposer}>取消</button>
        <button className="today-button" onClick={onSaveMaterial} disabled={isSavingMaterial}>
          {isSavingMaterial ? "保存中..." : "保存"}
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
  onEditMaterial,
  onToggleImportant,
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
  onEditMaterial: (materialId: string) => void;
  onToggleImportant: (materialId: string) => void;
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
  const visibleMaterials = day.materials.slice(0, 4);
  const hiddenCount = Math.max(0, day.materials.length - visibleMaterials.length);
  const visiblePets = visibleMaterials.map((material) => petForMaterial(material));
  const hasLegendary = visiblePets.some((pet) => pet.rarity === "legendary");
  const hasRareEvent = hasLegendary || visiblePets.filter((pet) => pet.rarity === "rare").length >= 2;

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
            onApplyNotePreset={onComposerNoteChange}
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
            onEdit={() => onEditMaterial(material.id)}
            onToggleImportant={() => onToggleImportant(material.id)}
          />
        ))}
        {hiddenCount > 0 ? (
          <button
            className={`reactor-more-hint ${hasRareEvent ? "reactor-more-hint-event" : ""}`}
            onClick={() => onOpenDay(day.dayKey)}
            aria-label="Open more notes"
          >
            <span className="reactor-more-dots">
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
  onEditMaterial,
  onToggleImportant,
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
  onEditMaterial: (materialId: string) => void;
  onToggleImportant: (materialId: string) => void;
  onUpdateLayout: (materialId: string, next: Partial<BoardLayout>) => void;
  onCloseComposer: () => void;
  onComposerTypeChange: (type: ReactorMaterialType) => void;
  onComposerContentChange: (value: string) => void;
  onComposerNoteChange: (value: string) => void;
  onComposerTagsChange: (value: string) => void;
  onSaveMaterial: () => void;
}) {
  const dayKey = day?.dayKey ?? todayDateKey();
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedExportIds, setSelectedExportIds] = useState<string[]>([]);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  useEffect(() => {
    setSelectedExportIds(materials.map((material) => material.id));
  }, [dayKey, materials]);

  useEffect(() => {
    if (!copiedMarkdown) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setCopiedMarkdown(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [copiedMarkdown]);

  const selectedExportMaterials = useMemo(
    () => materials.filter((material) => selectedExportIds.includes(material.id)),
    [materials, selectedExportIds],
  );
  const exportMarkdown = useMemo(
    () => buildReactorMarkdownExport(dayKey, selectedExportMaterials),
    [dayKey, selectedExportMaterials],
  );

  function handleOrganizeCanvas() {
    const nextLayouts = organizeReactorLayouts(materials, layouts);
    Object.entries(nextLayouts).forEach(([materialId, next]) => {
      onUpdateLayout(materialId, next);
    });
  }

  return (
    <section className="day-canvas">
      <header className="day-canvas-header">
        <div>
          <p className="day-canvas-kicker">Focused Day</p>
          <h2>{formatDayKey(dayKey)} · Daily Canvas</h2>
        </div>
        <div className="day-canvas-actions">
          <button className="nav-button" onClick={onBack}>Back to Week</button>
          <button className="nav-button" onClick={handleOrganizeCanvas}>
            <span className="nav-button-icon" aria-hidden="true">☷</span>
            Organize
          </button>
          <button className="nav-button" onClick={() => setExportOpen((value) => !value)}>
            <span className="nav-button-icon" aria-hidden="true">↓</span>
            Download
          </button>
          <div className="canvas-zoom-controls">
            <button className="nav-button" onClick={() => setCanvasScale((value) => Math.max(0.65, value - 0.1))}>－</button>
            <span>{Math.round(canvasScale * 100)}%</span>
            <button className="nav-button" onClick={() => setCanvasScale((value) => Math.min(3, value + 0.1))}>＋</button>
          </div>
        </div>
      </header>
      {exportOpen ? (
        <section className="reactor-export-sheet">
          <div className="reactor-export-header">
            <div>
              <strong>Export source pack</strong>
              <span>Pick notes to turn into a clean markdown bundle.</span>
            </div>
            <button className="ghost-action" onClick={() => setExportOpen(false)}>Close</button>
          </div>
          <div className="reactor-export-grid">
            <div className="reactor-export-list">
              {materials.map((material) => (
                <label key={material.id} className="reactor-export-item">
                  <input
                    type="checkbox"
                    checked={selectedExportIds.includes(material.id)}
                    onChange={() =>
                      setSelectedExportIds((current) =>
                        current.includes(material.id)
                          ? current.filter((id) => id !== material.id)
                          : [...current, material.id],
                      )
                    }
                  />
                  <span className="reactor-export-item-type">{labelForMaterialType(material.type)}</span>
                  <span className="reactor-export-item-title">{material.content}</span>
                </label>
              ))}
            </div>
            <div className="reactor-export-preview">
              <pre>{exportMarkdown}</pre>
              <div className="reactor-export-actions">
                <button
                  className={`top-tool ${copiedMarkdown ? "active" : ""}`}
                  onClick={async () => {
                    await navigator.clipboard.writeText(exportMarkdown);
                    setCopiedMarkdown(true);
                  }}
                >
                  {copiedMarkdown ? "Copied" : "Copy Markdown"}
                </button>
                <button
                  className="today-button"
                  onClick={() =>
                    downloadTextFile(
                      `reactor-${dayKey}.md`,
                      exportMarkdown,
                    )
                  }
                >
                  Download .md
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
      <div
        className="day-canvas-board reactor-canvas-board"
        onWheel={(event) => {
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -0.08 : 0.08;
            setCanvasScale((value) => Math.max(0.65, Math.min(3, value + delta)));
            return;
          }

          setCanvasOffset((current) => ({
            x: current.x - event.deltaX,
            y: current.y - event.deltaY,
          }));
        }}
        onMouseDown={(event) => {
          if ((event.target as HTMLElement).closest(".day-board-card, .reactor-canvas-composer")) {
            return;
          }

          const startX = event.clientX;
          const startY = event.clientY;
          const origin = canvasOffset;

          const handleMove = (moveEvent: MouseEvent) => {
            setCanvasOffset({
              x: origin.x + (moveEvent.clientX - startX),
              y: origin.y + (moveEvent.clientY - startY),
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
        <div className="reactor-canvas-toolbar">
          <button
            className={`reactor-canvas-fab ${isComposerOpen ? "active" : ""}`}
            onClick={() => (isComposerOpen ? onCloseComposer() : onOpenComposer("idea", dayKey))}
            aria-label={isComposerOpen ? "Close capture" : "Open capture"}
          >
            <span aria-hidden="true">{isComposerOpen ? "×" : "+"}</span>
          </button>
          {isComposerOpen ? (
            <div className="reactor-canvas-panel">
              <ReactorComposer
                dock
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
                onApplyNotePreset={onComposerNoteChange}
                onSaveMaterial={onSaveMaterial}
              />
            </div>
          ) : null}
        </div>
        <div
          className="reactor-canvas-content"
          style={{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
          }}
        >
        {materials.map((material, index) => {
          const layout = layouts[material.id] ?? defaultReactorLayout(index);
          return (
            <motion.article
              key={material.id}
              className="day-board-card reactor-board-card"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.7 }}
              style={{
                left: `${layout.x}px`,
                top: `${layout.y}px`,
                width: `${layout.width}px`,
                zIndex: layout.z,
                rotate: entryRotation(index),
              }}
              onMouseDown={(event) => {
                if ((event.target as HTMLElement).closest("button, a, .resize-handle")) {
                  return;
                }

                const startX = event.clientX;
                const startY = event.clientY;
                const startLeft = layout.x;
                const startTop = layout.y;
                const baseZ = Date.now();
                onUpdateLayout(material.id, { z: baseZ + 100 });

                const handleMove = (moveEvent: MouseEvent) => {
                  const dx = (moveEvent.clientX - startX) / canvasScale;
                  const dy = (moveEvent.clientY - startY) / canvasScale;
                  onUpdateLayout(material.id, {
                    x: startLeft + dx,
                    y: startTop + dy,
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
                onEdit={() => onEditMaterial(material.id)}
                onToggleImportant={() => onToggleImportant(material.id)}
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
                      width: Math.max(220, Math.min(460, startWidth + (moveEvent.clientX - startX) / canvasScale)),
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
      </div>
    </section>
  );
}

function ReactorMaterialCard({
  material,
  index,
  weekMode = false,
  onDelete,
  onEdit,
  onToggleImportant,
}: {
  material: ReactorDay["materials"][number];
  index: number;
  weekMode?: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onToggleImportant: () => void;
}) {
  const pet = petForMaterial(material);
  const weekCardStyle = weekMode ? reactorWeekCardStyle(material, index) : undefined;
  const imageUrl = material.meta?.imageUrl ?? material.meta?.previewImageUrl ?? null;
  const cardTitle = material.type === "link"
    ? material.meta?.previewTitle ?? material.content
    : material.type === "image"
      ? material.note || material.content
      : material.content;
  const cardMeta = material.type === "link"
    ? material.meta?.siteName ?? material.meta?.sourceUrl ?? material.note
    : material.note;
  const [imageVisible, setImageVisible] = useState(Boolean(imageUrl));
  const [copiedLink, setCopiedLink] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setImageVisible(Boolean(imageUrl));
  }, [imageUrl]);

  useEffect(() => {
    if (!copiedLink) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setCopiedLink(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [copiedLink]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <article
      className={`reactor-card reactor-card-material reactor-card-style-${entryDecoration(index)} ${
        weekMode ? "reactor-card-week" : "reactor-card-canvas"
      } reactor-bubble-${pet.bubble} reactor-rarity-${pet.rarity}`}
      style={weekCardStyle}
    >
      <div className={`reactor-bubble-tail reactor-bubble-tail-${pet.bubble}`} />
      <div
        className={`reactor-pet reactor-pet-${pet.mode} reactor-pet-rarity-${pet.rarity} ${
          weekMode ? "reactor-pet-week" : "reactor-pet-canvas"
        } ${material.important ? "reactor-pet-important" : ""}`}
        aria-hidden="true"
      >
        <PixelPetSprite pet={pet} size={weekMode ? 54 : 60} />
        {material.important ? <span className="reactor-pet-crown" aria-hidden="true">✦</span> : null}
      </div>
      <button
        className={`entry-important ${material.important ? "active" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleImportant();
        }}
        title={material.important ? "Unmark important" : "Mark important"}
      >
        ★
      </button>
      <div
        ref={menuRef}
        className={`entry-menu ${menuOpen ? "open" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="entry-menu-trigger"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((value) => !value);
          }}
          aria-label="Open card menu"
          title="More"
        >
          ⋯
        </button>
        {menuOpen ? (
          <div className="entry-menu-panel">
            <button
              className="entry-menu-item"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen(false);
                onEdit();
              }}
            >
              编辑
            </button>
            {material.type === "link" && material.meta?.sourceUrl ? (
              <button
                className={`entry-menu-item ${copiedLink ? "copied" : ""}`}
                onClick={(event) => {
                  event.stopPropagation();
                  void navigator.clipboard.writeText(material.meta?.sourceUrl ?? "");
                  setCopiedLink(true);
                  setMenuOpen(false);
                }}
              >
                {copiedLink ? "已复制链接" : "复制链接"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <button
        className="entry-delete"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      >
        ×
      </button>
      <span className="reactor-card-type">{labelForMaterialTypeZh(material.type)}</span>
      {material.type === "link" && material.meta?.sourceUrl ? (
        <a
          className="reactor-card-link-open"
          href={material.meta.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
        >
          {imageUrl && imageVisible ? (
            <div className="reactor-card-image reactor-card-image-link">
              <img src={imageUrl} alt={cardTitle} onError={() => setImageVisible(false)} />
            </div>
          ) : (
            <div className="reactor-card-link-fallback">
              <span className="reactor-card-link-favicon">{(material.meta?.siteName ?? "Link").slice(0, 1)}</span>
              <span>{material.meta?.siteName ?? "Link preview unavailable"}</span>
            </div>
          )}
          <p className="reactor-card-title">{cardTitle}</p>
          {!weekMode && cardMeta ? <p className="reactor-card-meta">{cardMeta}</p> : null}
        </a>
      ) : (
        <>
          {imageUrl && imageVisible ? (
            <div className={`reactor-card-image ${material.type === "link" ? "reactor-card-image-link" : ""}`}>
              <img src={imageUrl} alt={cardTitle} onError={() => setImageVisible(false)} />
            </div>
          ) : material.type === "link" ? (
            <div className="reactor-card-link-fallback">
              <span className="reactor-card-link-favicon">{(material.meta?.siteName ?? "Link").slice(0, 1)}</span>
              <span>{material.meta?.siteName ?? "Link preview unavailable"}</span>
            </div>
          ) : null}
          <p className="reactor-card-title">{cardTitle}</p>
          {!weekMode && cardMeta ? <p className="reactor-card-meta">{cardMeta}</p> : null}
        </>
      )}
    </article>
  );
}

function defaultMaterialTags(type: ReactorMaterialType) {
  return [labelForMaterialTypeZh(type)];
}

function meaningfulTagForMaterial(material: ReactorMaterial) {
  const reserved = new Set([
    labelForMaterialType(material.type).toLowerCase(),
    labelForMaterialTypeZh(material.type).toLowerCase(),
  ]);

  const tag = material.manualTags.find((entry) => {
    const normalized = entry.trim().toLowerCase();
    return normalized && !reserved.has(normalized);
  });

  return tag ?? labelForMaterialTypeZh(material.type);
}

function organizeReactorLayouts(
  materials: ReactorMaterial[],
  currentLayouts: Record<string, BoardLayout>,
) {
  const grouped = new Map<string, ReactorMaterial[]>();

  materials.forEach((material) => {
    const key = meaningfulTagForMaterial(material);
    const current = grouped.get(key) ?? [];
    current.push(material);
    grouped.set(key, current);
  });

  const orderedGroups = [...grouped.entries()].sort((left, right) => {
    if (right[1].length !== left[1].length) {
      return right[1].length - left[1].length;
    }
    return left[0].localeCompare(right[0], "zh-Hans-CN");
  });

  let cursorX = 120;
  let cursorY = 120;
  let rowHeight = 0;
  const canvasMaxWidth = 3600;
  const nextLayouts: Record<string, BoardLayout> = {};

  orderedGroups.forEach(([_, group], groupIndex) => {
    const items = [...group].sort((left, right) => {
      if (Number(right.important) !== Number(left.important)) {
        return Number(right.important) - Number(left.important);
      }
      return left.content.localeCompare(right.content, "zh-Hans-CN");
    });

    const columnWidth = 300;
    const columnGap = 34;
    const groupWidth = items.length > 1 ? columnWidth * 2 + columnGap : columnWidth;
    const xLimit = cursorX + groupWidth;

    if (xLimit > canvasMaxWidth) {
      cursorX = 120;
      cursorY += rowHeight + 88;
      rowHeight = 0;
    }

    const columnHeights = [cursorY, cursorY];
    items.forEach((material, itemIndex) => {
      const height = defaultReactorCardHeight(material);
      const columnIndex = columnHeights[0] <= columnHeights[1] ? 0 : 1;
      const useSingleColumn = items.length === 1;
      const x = cursorX + (useSingleColumn ? 0 : columnIndex * (columnWidth + columnGap));
      const y = useSingleColumn ? columnHeights[0] : columnHeights[columnIndex];

      nextLayouts[material.id] = {
        ...(currentLayouts[material.id] ?? defaultReactorLayout(itemIndex)),
        x,
        y,
        width: Math.max(260, Math.min(340, currentLayouts[material.id]?.width ?? columnWidth)),
        z: groupIndex * 10 + itemIndex + 1,
      };

      columnHeights[useSingleColumn ? 0 : columnIndex] = y + height + 28;
      if (useSingleColumn) {
        columnHeights[1] = columnHeights[0];
      }
    });

    const groupHeight = Math.max(...columnHeights) - cursorY;
    rowHeight = Math.max(rowHeight, groupHeight);
    cursorX += groupWidth + 72;
  });

  return nextLayouts;
}

function buildReactorMarkdownExport(dayKey: string, materials: ReactorMaterial[]) {
  const grouped = new Map<ReactorMaterialType, ReactorMaterial[]>();
  materials.forEach((material) => {
    const current = grouped.get(material.type) ?? [];
    current.push(material);
    grouped.set(material.type, current);
  });

  const orderedTypes: ReactorMaterialType[] = ["idea", "diary", "prompt", "sample", "link", "image"];
  const sections = orderedTypes
    .map((type) => {
      const items = grouped.get(type) ?? [];
      if (items.length === 0) {
        return null;
      }

      const body = items
        .map((material) => materialToMarkdown(material))
        .join("\n\n");
      return `## ${pluralLabelForMaterialType(type)}\n\n${body}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return `# Reactor Export · ${dayKey}\n\n${sections}`.trim();
}

function materialToMarkdown(material: ReactorMaterial) {
  const lines = [`- ${material.content}`];

  if (material.note) {
    lines.push(`  - Why keep: ${material.note}`);
  }

  if (material.manualTags.length > 0) {
    lines.push(`  - Tags: ${material.manualTags.join(", ")}`);
  }

  if (material.important) {
    lines.push("  - Important: yes");
  }

  if (material.type === "link" && material.meta?.sourceUrl) {
    lines.push(`  - URL: ${material.meta.sourceUrl}`);
  }

  if (material.type === "image" && material.meta?.imageUrl) {
    lines.push(`  - Image: ${material.meta.imageUrl}`);
  }

  return lines.join("\n");
}

function pluralLabelForMaterialType(type: ReactorMaterialType) {
  switch (type) {
    case "diary":
      return "Diary";
    case "idea":
      return "Ideas";
    case "prompt":
      return "Prompts";
    case "link":
      return "Links";
    case "sample":
      return "Samples";
    case "image":
      return "Images";
    default:
      return "Notes";
  }
}

function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
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
      viewBox="0 0 20 20"
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
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    weekend: "Weekend",
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
    image: "Image",
  }[type];
}

function labelForMaterialTypeZh(type: ReactorMaterialType) {
  return {
    diary: "日记",
    idea: "点子",
    prompt: "提示词",
    link: "链接",
    sample: "样本",
    image: "图片",
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

function startOfCurrentWeek(offset = 0) {
  const today = new Date();
  const start = new Date(today);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff + offset * 7);
  start.setHours(0, 0, 0, 0);
  return start;
}

function buildReactorWeek(days: ReactorDay[], offset = 0) {
  const start = startOfCurrentWeek(offset);
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

function readStoredJson<T>(key: string, fallback: T) {
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

function defaultReactorLayout(index: number): BoardLayout {
  const col = index % 5;
  const row = Math.floor(index / 5);

  return {
    x: 56 + col * 308 + (index % 2 === 0 ? 8 : -10),
    y: 88 + row * 232 + (index % 3) * 10,
    width: 258,
    z: index + 1,
  };
}

function findOpenReactorLayout(
  existingLayouts: Record<string, BoardLayout>,
  material: ReactorDay["materials"][number],
  index: number,
): BoardLayout {
  const width = defaultReactorCardWidth(material);
  const height = defaultReactorCardHeight(material);
  const placements = Object.values(existingLayouts);
  const columns = [56, 372, 688, 1004, 1320, 1636, 1952, 2268, 2584];

  for (let row = 0; row < 12; row += 1) {
    const y = 88 + row * 232;

    for (const x of columns) {
      const candidate = { x, y, width, z: placements.length + index + 1 };
      if (!isReactorLayoutOccupied(candidate, height, placements)) {
        return candidate;
      }
    }
  }

  return {
    x: 56 + (index % 6) * 304,
    y: 88 + Math.floor(index / 6) * 232,
    width,
    z: placements.length + index + 1,
  };
}

function defaultReactorCardWidth(material: ReactorDay["materials"][number]) {
  if (material.type === "image") {
    return 300;
  }
  if (material.type === "link") {
    return 284;
  }
  return 258;
}

function defaultReactorCardHeight(material: ReactorDay["materials"][number]) {
  if (material.type === "image") {
    return 284;
  }
  if (material.type === "link") {
    return material.meta?.previewImageUrl ? 276 : 228;
  }
  return 186;
}

function isReactorLayoutOccupied(
  candidate: BoardLayout,
  candidateHeight: number,
  layouts: BoardLayout[],
) {
  return layouts.some((layout) => {
    const layoutHeight = 230;
    return !(
      candidate.x + candidate.width + 24 < layout.x ||
      layout.x + layout.width + 24 < candidate.x ||
      candidate.y + candidateHeight + 24 < layout.y ||
      layout.y + layoutHeight + 24 < candidate.y
    );
  });
}

function buildReactorWeeklySummary(board: ReactorBoard | null) {
  const materials = board?.days.flatMap((day) => day.materials) ?? [];
  const activeDays = board?.days.filter((day) => day.materials.length > 0).length ?? 0;
  const typeCount = new Map<string, number>();

  materials.forEach((material) => {
    const label = labelForMaterialType(material.type);
    typeCount.set(label, (typeCount.get(label) ?? 0) + 1);
  });

  return {
    totalItems: materials.length,
    activeDays,
    topTypes: Array.from(typeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count })),
  };
}

function reactorWeekTitle(offset: number) {
  const start = startOfCurrentWeek(offset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return `${monthDayLabel(start)} - ${monthDayLabel(end)} Digest`;
}

function monthDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isEditableTarget(target: HTMLElement | null) {
  if (!target) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || target.isContentEditable;
}

function isProbablyUrl(input: string) {
  try {
    new URL(input);
    return true;
  } catch {
    return /^(https?:\/\/|www\.)/i.test(input);
  }
}

function normalizeUrl(input: string) {
  try {
    return new URL(input).toString();
  } catch {
    return new URL(`https://${input}`).toString();
  }
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

  if (bucket < 30) {
    return legendary[value % legendary.length];
  }

  if (bucket < 300) {
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
  const blush = "rgba(255, 214, 214, 0.85)";
  const highlight = "#fffaf1";
  const pixels: Array<{ x: number; y: number; fill: string }> = [];

  const paint = (coords: Array<[number, number]>, fill: string) => {
    coords.forEach(([x, y]) => {
      pixels.push({ x, y, fill });
    });
  };

  const speciesPixels: Record<
    ReactorPet["species"],
    {
      body: Array<[number, number]>;
      accent?: Array<[number, number]>;
      shade?: Array<[number, number]>;
      eyes: Array<[number, number]>;
      cheeks?: Array<[number, number]>;
      highlight?: Array<[number, number]>;
    }
  > = {
    slime: {
      body: [
        [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6],
        [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7],
        [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
        [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9], [14, 9],
        [6, 10], [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [12, 10], [13, 10],
        [7, 11], [8, 11], [9, 11], [10, 11], [11, 11], [12, 11],
      ],
      accent: [[7, 7], [12, 7], [8, 11], [11, 11]],
      shade: [[6, 10], [13, 10], [7, 11], [12, 11]],
      eyes: [[8, 9], [11, 9]],
      cheeks: [[7, 10], [12, 10]],
      highlight: [[8, 7], [9, 7], [10, 7]],
    },
    fox: {
      body: [
        [7, 4], [12, 4],
        [6, 5], [7, 5], [8, 5], [11, 5], [12, 5], [13, 5],
        [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
        [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7],
        [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8],
        [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9],
        [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [12, 10],
        [12, 11], [13, 11], [14, 11],
      ],
      accent: [[7, 4], [12, 4], [13, 11], [14, 11]],
      shade: [[6, 7], [13, 7], [7, 10], [11, 10]],
      eyes: [[8, 8], [11, 8]],
      cheeks: [[7, 9], [12, 9]],
      highlight: [[9, 6], [10, 6]],
    },
    sprout: {
      body: [
        [9, 3], [10, 3],
        [8, 4], [9, 4], [10, 4], [11, 4],
        [8, 5], [9, 5], [10, 5], [11, 5],
        [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6],
        [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7],
        [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8],
        [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9],
        [8, 10], [9, 10], [10, 10], [11, 10],
      ],
      accent: [[8, 4], [11, 4], [9, 3], [10, 3]],
      shade: [[7, 8], [12, 8], [8, 9], [11, 9]],
      eyes: [[8, 8], [11, 8]],
      cheeks: [[7, 9], [12, 9]],
      highlight: [[9, 5], [10, 5]],
    },
    moth: {
      body: [
        [6, 5], [13, 5],
        [4, 6], [5, 6], [6, 6], [7, 6], [12, 6], [13, 6], [14, 6], [15, 6],
        [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [11, 7], [12, 7], [13, 7], [14, 7], [15, 7], [16, 7],
        [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [15, 8],
        [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9], [14, 9],
        [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [12, 10],
      ],
      accent: [[4, 7], [15, 7], [6, 6], [13, 6]],
      shade: [[6, 9], [13, 9], [8, 10], [11, 10]],
      eyes: [[8, 8], [11, 8]],
      cheeks: [[7, 9], [12, 9]],
      highlight: [[9, 7], [10, 7]],
    },
    pup: {
      body: [
        [7, 4], [12, 4],
        [6, 5], [7, 5], [8, 5], [11, 5], [12, 5], [13, 5],
        [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6],
        [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 7],
        [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
        [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [13, 9],
        [6, 10], [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [12, 10], [13, 10],
        [6, 11], [7, 11], [12, 11], [13, 11],
      ],
      accent: [[7, 4], [12, 4], [6, 11], [13, 11]],
      shade: [[6, 8], [13, 8], [7, 10], [12, 10]],
      eyes: [[8, 8], [11, 8]],
      cheeks: [[7, 9], [12, 9]],
      highlight: [[9, 6], [10, 6]],
    },
    owl: {
      body: [
        [8, 4], [11, 4],
        [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5],
        [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6],
        [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7],
        [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8],
        [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9],
        [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [12, 10],
        [7, 11], [8, 11], [11, 11], [12, 11],
      ],
      accent: [[8, 4], [11, 4], [7, 11], [12, 11]],
      shade: [[6, 8], [13, 8], [8, 10], [11, 10]],
      eyes: [[8, 8], [11, 8]],
      cheeks: [[7, 9], [12, 9]],
      highlight: [[9, 6], [10, 6]],
    },
  };

  const template = speciesPixels[pet.species];

  paint(template.body, base);
  paint(template.accent ?? [], accent);
  paint(template.shade ?? [], shade);
  paint(template.highlight ?? [], highlight);
  paint(template.cheeks ?? [], blush);
  paint(template.eyes, eye);

  paint(
    [
      [9, 9],
      [10, 9],
    ],
    highlight,
  );

  if (pet.rarity === "legendary") {
    paint(
      [
        [15, 3],
        [16, 4],
        [15, 5],
        [14, 4],
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
