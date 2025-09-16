import React from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RoundConfig, TimerSettings } from "../hooks/useRoundTimer";
import { MmssInput } from "./MmssInput";

interface BaseProps {
  rounds: RoundConfig[];
  onAddRound: () => void;
}

/** Nouvelle API (recommandée) */
interface WithSettingsProps extends BaseProps {
  settings: TimerSettings;
  onChangeSettings: (s: TimerSettings) => void;
  onChange?: never;
}

/** Ancienne API (compat) */
interface LegacyProps extends BaseProps {
  onChange: (next: RoundConfig[]) => void;
  settings?: never;
  onChangeSettings?: never;
}

type CustomSettingsProps = WithSettingsProps | LegacyProps;

const SortableItem: React.FC<{
  id: string;
  index: number;
  round: RoundConfig;
  rounds: RoundConfig[];
  onChange: (next: RoundConfig[]) => void;
  onRemove: (index: number) => void;
}> = ({ id, index, round, rounds, onChange, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
  };

  const update = (key: keyof RoundConfig, value: number) => {
    const next = [...rounds];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="custom__row"
    >
      <button
        className="danger btn-icon small"
        title="Supprimer ce round"
        onMouseDown={(e) => e.stopPropagation()} // évite de déclencher le drag
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
      >
        ✕
      </button>

      <MmssInput
        label={`Round ${index + 1}`}
        seconds={round.workSeconds}
        onChangeSeconds={(sec: number) => update("workSeconds", sec)}
      />

      <MmssInput
        label="Pause"
        seconds={round.restSeconds}
        onChangeSeconds={(sec: number) => update("restSeconds", sec)}
      />
    </div>
  );
};

export const CustomSettings: React.FC<CustomSettingsProps> = (props) => {
  const { rounds, onAddRound } = props;

  // capteurs drag avec délai
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  /** Propagation des changements de rounds vers le parent.
   *  - Nouvelle API : met à jour settings.rounds, et aligne totalRounds si non vide
   *  - Ancienne API : remonte juste le tableau
   */
  const applyRounds = (next: RoundConfig[]) => {
    if ("onChangeSettings" in props && typeof props.onChangeSettings === "function") {
      const s = (props as WithSettingsProps).settings;
      const nextSettings: TimerSettings = {
        ...s,
        rounds: next,
        ...(next.length > 0 ? { totalRounds: next.length } : {}),
      };
      props.onChangeSettings(nextSettings);
      return;
    }
    if ("onChange" in props && typeof props.onChange === "function") {
      props.onChange(next);
      return;
    }
    console.warn(
      "[CustomSettings] Aucun handler de changement fourni (onChangeSettings / onChange)."
    );
  };

  const handleRemoveAt = (idx: number) => {
    const next = [...rounds];
    next.splice(idx, 1);
    applyRounds(next);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rounds.findIndex((_, i) => String(i) === active.id);
      const newIndex = rounds.findIndex((_, i) => String(i) === over.id);
      const next = arrayMove(rounds, oldIndex, newIndex) as RoundConfig[];
      applyRounds(next);
    }
  };

  return (
    <div className="custom">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8, paddingRight: 8 }}>
        <button
          className="btn-icon small"
          onClick={onAddRound}
          title="Ajouter un round"
        >
          +
        </button>
      </div>

      <div className="custom__scroller">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={rounds.map((_, i) => String(i))}
            strategy={verticalListSortingStrategy}
          >
            {rounds.map((r: RoundConfig, i: number) => (
              <SortableItem
                key={i}
                id={String(i)}
                index={i}
                round={r}
                rounds={rounds}
                onChange={applyRounds}
                onRemove={handleRemoveAt}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
