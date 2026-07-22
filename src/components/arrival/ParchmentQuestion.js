// FINAL CHECK-IN LABEL POLISH
// Keeps Overwhelmed and Encouragement intact and disables recent suggestions.

import React from "react";

export default function ParchmentQuestion({
  id,
  question,
  options,
  selected,
  selectedCount,
  onToggle,
  panelImage,
  chipImage,
  customOption,
  customValue = "",
  onCustomChange,
  customEntryOpen = false,
  onConfirmCustom,
  customEntryImage,
  customItems = [],
  onRemoveCustom,
  maxSelections = 3,
}) {
  const totalSelected = selectedCount ?? selected.length;

  return (
    <article className={`parchment-question parchment-question--${id}`}>
      <img
        className="parchment-question__paper"
        src={panelImage}
        alt=""
        aria-hidden="true"
      />

      <div className="parchment-question__content">
        <header className="parchment-question__header">
          <h1 id={`${id}-question`}>{question}</h1>
          <p id={`${id}-instructions`}>
            Choose up to three <span>— {totalSelected} of 3 selected</span>
          </p>
        </header>

        <div
          className="parchment-question__choices"
          role="group"
          aria-labelledby={`${id}-question`}
          aria-describedby={`${id}-instructions`}
        >
          {options.map((option) => {
            const isSelected = selected.includes(option);
            const isUnavailable =
              totalSelected >= maxSelections && !isSelected;

            return (
              <button
                key={option}
                type="button"
                className={`parchment-choice${
                  isSelected ? " parchment-choice--selected" : ""
                }${
                  option === "Overwhelmed"
                    ? " parchment-choice--overwhelmed"
                    : ""
                }${
                  option === "Encouragement"
                    ? " parchment-choice--encouragement"
                    : ""
                }`}
                style={{ "--choice-paper": `url(${chipImage})` }}
                aria-pressed={isSelected}
                aria-disabled={isUnavailable}
                onClick={() => onToggle(option)}
              >
                <span className="parchment-choice__label">{option}</span>
                {isSelected && (
                  <span className="parchment-choice__check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {customItems.length > 0 && (
          <div className="parchment-question__custom-items" aria-label="Custom feelings">
            {customItems.map((item) => (
              <button
                key={item}
                type="button"
                className="parchment-question__custom-item"
                style={{ "--choice-paper": `url(${chipImage})` }}
                onClick={() => onRemoveCustom?.(item)}
                aria-label={`Remove ${item}`}
                title={`Remove ${item}`}
              >
                <span>{item}</span>
                <span aria-hidden="true">✓</span>
              </button>
            ))}
          </div>
        )}

        {customOption && (
          <div
            className={`parchment-question__custom${
              customEntryOpen ? " parchment-question__custom--visible" : ""
            }`}
            aria-hidden={!customEntryOpen}
          >
            <img
              className="parchment-question__custom-paper"
              src={customEntryImage}
              alt=""
              aria-hidden="true"
            />
            <input
              id={`${id}-custom-answer`}
              name={`${id}-custom-feeling-entry`}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              data-form-type="other"
              data-lpignore="true"
              value={customValue}
              maxLength={80}
              tabIndex={customEntryOpen ? 0 : -1}
              onChange={(event) => onCustomChange?.(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onConfirmCustom?.();
                }
              }}
              placeholder="Write it in your own words…"
              aria-label="Describe how you are feeling in your own words"
            />
            <button
              type="button"
              className="parchment-question__custom-confirm"
              onClick={onConfirmCustom}
              disabled={!customValue.trim()}
              tabIndex={customEntryOpen ? 0 : -1}
              aria-label="Add this custom feeling"
            >
              ✓
            </button>
          </div>
        )}
      </div>
    </article>
  );
}