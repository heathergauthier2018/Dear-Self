// Happy and Grateful replace Tender and Restless in FEELING_OPTIONS.
// The action alignment and Not Today text-spacing changes are in GentleCheckIn CSS.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ParchmentQuestion from "./ParchmentQuestion";
import "../../styles/GentleCheckIn.css";

const FEELING_OPTIONS = [
  "Calm",
  "Hopeful",
  "Happy",
  "Grateful",
  "Tired",
  "Sad",
  "Heavy",
  "Anxious",
  "Overwhelmed",
  "Numb",
  "Unsure",
  "Something else",
];

const SUPPORT_OPTIONS = [
  "Quiet",
  "Encouragement",
  "Perspective",
  "A small challenge",
  "Rest",
  "A gentle prompt",
  "Space to write",
  "Grounding",
  "Reassurance",
  "Inspiration",
  "An affirmation",
  "I'm not sure yet",
];

const asset = (fileName) =>
  `${process.env.PUBLIC_URL || ""}/images/arrival/${fileName}`;

export default function GentleCheckIn({ onContinue, onSkip }) {
  const navigate = useNavigate();
  const [feelings, setFeelings] = useState([]);
  const [customFeelings, setCustomFeelings] = useState([]);
  const [support, setSupport] = useState([]);
  const [customFeelingDraft, setCustomFeelingDraft] = useState("");
  const [customEntryOpen, setCustomEntryOpen] = useState(false);

  const feelingCount = feelings.length + customFeelings.length;

  const toggleChoice = (choice, setSelected) => {
    setSelected((current) => {
      if (current.includes(choice)) {
        return current.filter((item) => item !== choice);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, choice];
    });
  };

  const toggleFeeling = (choice) => {
    if (choice === "Something else") {
      if (feelingCount < 3) {
        setCustomEntryOpen((current) => !current);
      }
      return;
    }

    setFeelings((current) => {
      if (current.includes(choice)) {
        return current.filter((item) => item !== choice);
      }

      if (current.length + customFeelings.length >= 3) {
        return current;
      }

      const next = [...current, choice];
      if (next.length + customFeelings.length >= 3) {
        setCustomEntryOpen(false);
      }
      return next;
    });
  };

  const confirmCustomFeeling = () => {
    const availableSlots = 3 - feelingCount;
    if (availableSlots <= 0) return;

    const existing = new Set(
      [...feelings, ...customFeelings].map((item) => item.toLowerCase()),
    );
    const additions = customFeelingDraft
      .split(/[,;\n]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => {
        const key = item.toLowerCase();
        if (existing.has(key)) return false;
        existing.add(key);
        return true;
      })
      .slice(0, availableSlots);

    if (!additions.length) return;

    setCustomFeelings((current) => [...current, ...additions]);
    setCustomFeelingDraft("");

    if (additions.length >= availableSlots) {
      setCustomEntryOpen(false);
    }
  };

  const removeCustomFeeling = (feeling) => {
    setCustomFeelings((current) =>
      current.filter((item) => item !== feeling),
    );
  };

  const openJournal = () => {
    if (onSkip) {
      onSkip();
      return;
    }

    navigate("/today");
  };

  const continueFromCheckIn = () => {
    const checkIn = {
      feelings: [...feelings, ...customFeelings],
      customFeelings,
      support,
      completedAt: new Date().toISOString(),
    };

    localStorage.setItem("dearself.gentleCheckIn.latest", JSON.stringify(checkIn));

    if (onContinue) {
      onContinue(checkIn);
      return;
    }

    navigate("/threshold-gallery");
  };

  return (
    <main
      className="gentle-checkin"
      style={{
        "--arrival-background": `url(${asset(
          "gentle-checkin-background.png",
        )})`,
      }}
    >
      <section className="gentle-checkin__content" aria-label="A gentle check-in">
        <div className="gentle-checkin__questions">
          <ParchmentQuestion
            id="feelings"
            question="How are you feeling right now?"
            options={FEELING_OPTIONS}
            selected={feelings}
            selectedCount={feelingCount}
            onToggle={toggleFeeling}
            panelImage={asset("gentle-checkin-feelings-panel.png")}
            chipImage={asset("gentle-checkin-choice-chip.png")}
            customOption="Something else"
            customValue={customFeelingDraft}
            onCustomChange={setCustomFeelingDraft}
            customEntryOpen={customEntryOpen && feelingCount < 3}
            onConfirmCustom={confirmCustomFeeling}
            customEntryImage={asset("gentle-checkin-custom-entry.png")}
            customItems={customFeelings}
            onRemoveCustom={removeCustomFeeling}
            maxSelections={3}
          />

          <ParchmentQuestion
            id="support"
            question="What would feel most supportive right now?"
            options={SUPPORT_OPTIONS}
            selected={support}
            onToggle={(choice) => toggleChoice(choice, setSupport)}
            panelImage={asset("gentle-checkin-support-panel.png")}
            chipImage={asset("gentle-checkin-choice-chip.png")}
          />
        </div>

        <div className="gentle-checkin__actions">
          <button
            type="button"
            className="gentle-checkin__skip"
            onClick={openJournal}
          >
            <img
              src={asset("gentle-checkin-not-today-strip.png")}
              alt=""
              aria-hidden="true"
            />
            <span>Not today. Take me to my journal.</span>
          </button>

          <button
            type="button"
            className="gentle-checkin__continue"
            onClick={continueFromCheckIn}
          >
            <img
              src={asset("gentle-checkin-continue-button.png")}
              alt=""
              aria-hidden="true"
            />
            <span>Continue</span>
          </button>
        </div>
      </section>
    </main>
  );
}