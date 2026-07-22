import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  buildMirrorMessage,
  readLatestCheckIn,
  saveThresholdChoice,
  THRESHOLD_DOORS,
} from "../../config/thresholdGalleryConfig";
import "../../styles/ThresholdGallery.css";

const asset = (name) =>
  `${process.env.PUBLIC_URL || ""}/images/arrival/${name}`;

function playThresholdChime(audioContextRef) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = audioContextRef.current || new AudioContext();
  audioContextRef.current = context;
  if (context.state === "suspended") context.resume();

  const now = context.currentTime;
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.055, now + 0.025);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
  master.connect(context.destination);

  [523.25, 659.25].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(index === 0 ? 0.72 : 0.46, now);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now + index * 0.08);
    oscillator.stop(now + 1.18);
  });
}

export default function ThresholdGallery({ onSelectDoor, onSkip }) {
  const navigate = useNavigate();
  const audioContextRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const [selectedDoor, setSelectedDoor] = useState(null);
  const checkIn = useMemo(() => readLatestCheckIn(), []);
  const mirrorMessage = useMemo(() => buildMirrorMessage(checkIn), [checkIn]);

  useEffect(
    () => () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
      audioContextRef.current?.close?.();
    },
    [],
  );

  const openJournal = () => {
    if (selectedDoor) return;
    if (onSkip) return onSkip();
    navigate("/today");
  };

  const chooseDoor = (door) => {
    if (selectedDoor) return;
    setSelectedDoor(door.id);
    saveThresholdChoice(door, checkIn);
    playThresholdChime(audioContextRef);

    transitionTimerRef.current = window.setTimeout(() => {
      if (onSelectDoor) return onSelectDoor(door, checkIn);

      // Swap these destinations for the dedicated duration rooms as each room
      // is built. Until then, the completed transition opens today's journal.
      navigate(door.destination);
    }, 1050);
  };

  return (
    <main
      className={`threshold-gallery${
        selectedDoor ? " threshold-gallery--transitioning" : ""
      }`}
      aria-label="Threshold Gallery"
    >
      <div className="threshold-gallery__stage">
        <img
          className="threshold-gallery__master"
          src={asset("threshold-gallery-master-soft-arches.png")}
          alt="A luminous gallery with an ornate mirror and three cream-and-gold doors"
        />

        <div className="threshold-gallery__question">
          <h1>
            <span className="threshold-gallery__question-line">
              How much time do you have
            </span>
            <span className="threshold-gallery__question-emphasis">
              for <em>yourself</em> today?
            </span>
          </h1>
        </div>

        <aside className="threshold-gallery__mirror" aria-label="A note to yourself">
          <p className="threshold-gallery__dear-self">Dear Self,</p>
          <p>{mirrorMessage.reassurance}</p>
          <p>{mirrorMessage.prompt}</p>
        </aside>

        <div className="threshold-gallery__doors" aria-label="Choose how much time you have">
          {THRESHOLD_DOORS.map((door) => {
            const isSelected = selectedDoor === door.id;
            const isUnavailable = Boolean(selectedDoor) && !isSelected;
            return (
              <div
                className={`threshold-gallery__door-group ${door.className}`}
                key={door.id}
              >
                <svg
                  className="threshold-gallery__door-label"
                  viewBox="0 0 240 90"
                  role="img"
                  aria-label={door.label}
                >
                  <defs>
                    <path
                      id={`threshold-label-curve-${door.id}`}
                      d="M 8 76 Q 120 -8 232 76"
                    />
                  </defs>
                  <text>
                    <textPath
                      href={`#threshold-label-curve-${door.id}`}
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      {door.label}
                    </textPath>
                  </text>
                </svg>
                <button
                  type="button"
                  className={`threshold-gallery__door${
                    isSelected ? " threshold-gallery__door--selected" : ""
                  }`}
                  onClick={() => chooseDoor(door)}
                  disabled={isUnavailable}
                  aria-label={door.ariaLabel}
                  aria-pressed={isSelected}
                >
                  <span className="threshold-gallery__door-glow" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="threshold-gallery__skip"
          onClick={openJournal}
          disabled={Boolean(selectedDoor)}
        >
          Skip this and open my journal
        </button>

        <p className="threshold-gallery__mobile-mirror" aria-hidden="true">
          <span>Dear Self,</span> {mirrorMessage.reassurance}
        </p>
      </div>

      <div className="threshold-gallery__light-transition" aria-hidden="true" />
      <p className="threshold-gallery__status" aria-live="polite">
        {selectedDoor ? "Opening a gentle space for you…" : ""}
      </p>
    </main>
  );
}