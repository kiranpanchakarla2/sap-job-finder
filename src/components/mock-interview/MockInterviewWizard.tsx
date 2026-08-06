"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { sapModules } from "@/lib/constants";

const experienceLevels = ["0–2 years", "3–5 years", "6–10 years", "10+ years"];
const difficulties = ["Easy", "Medium", "Hard"];

const sampleQuestions = [
  "Explain the difference between SAP Commerce and SAP ERP in a customer journey.",
  "How would you design a CAP service on BTP for master data sync?",
  "Walk through a typical Fiori extension scenario on S/4HANA.",
];

type Step =
  | "module"
  | "experience"
  | "difficulty"
  | "interview"
  | "score";

export function MockInterviewWizard() {
  const [step, setStep] = useState<Step>("module");
  const [module, setModule] = useState("");
  const [experience, setExperience] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);

  const nextQuestion = () => {
    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);
    setAnswer("");
    if (qIndex >= sampleQuestions.length - 1) {
      setStep("score");
    } else {
      setQIndex((i) => i + 1);
    }
  };

  if (step === "score") {
    const score = Math.min(95, 60 + answers.filter((a) => a.trim().length > 40).length * 12);
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
        <h2 className="text-xl font-bold text-text">Interview score</h2>
        <p className="mt-2 text-4xl font-bold text-primary">{score}</p>
        <p className="mt-3 text-sm text-muted">
          Shell feedback only — AI scoring arrives in Phase 3. You covered{" "}
          {module || "your module"} at {difficulty || "selected"} difficulty.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Structure answers with situation → action → result.</li>
          <li>Call out SAP module-specific APIs and integration points.</li>
          <li>Practice timed responses for live mock interviews later.</li>
        </ul>
        <Button
          className="mt-6"
          type="button"
          onClick={() => {
            setStep("module");
            setModule("");
            setExperience("");
            setDifficulty("");
            setQIndex(0);
            setAnswers([]);
          }}
        >
          Start again
        </Button>
      </div>
    );
  }

  if (step === "interview") {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Question {qIndex + 1} / {sampleQuestions.length}
        </p>
        <h2 className="mt-2 text-lg font-semibold text-text">
          {sampleQuestions[qIndex]}
        </h2>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={6}
          placeholder="Type your answer…"
          className="mt-4 w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Button className="mt-4" type="button" onClick={nextQuestion}>
          {qIndex >= sampleQuestions.length - 1 ? "Finish" : "Next"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
      {step === "module" ? (
        <>
          <h2 className="text-lg font-semibold text-text">Choose module</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {sapModules.map((m) => (
              <button
                key={m.slug}
                type="button"
                onClick={() => setModule(m.name)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                  module === m.name
                    ? "bg-primary text-button-fg"
                    : "bg-surface text-muted"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
          <Button
            className="mt-6"
            type="button"
            disabled={!module}
            onClick={() => setStep("experience")}
          >
            Continue
          </Button>
        </>
      ) : null}

      {step === "experience" ? (
        <>
          <h2 className="text-lg font-semibold text-text">Choose experience</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {experienceLevels.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setExperience(level)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                  experience === level
                    ? "bg-primary text-button-fg"
                    : "bg-surface text-muted"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <Button
            className="mt-6"
            type="button"
            disabled={!experience}
            onClick={() => setStep("difficulty")}
          >
            Continue
          </Button>
        </>
      ) : null}

      {step === "difficulty" ? (
        <>
          <h2 className="text-lg font-semibold text-text">Choose difficulty</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {difficulties.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                  difficulty === d
                    ? "bg-primary text-button-fg"
                    : "bg-surface text-muted"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <Button
            className="mt-6"
            type="button"
            disabled={!difficulty}
            onClick={() => setStep("interview")}
          >
            Start interview
          </Button>
        </>
      ) : null}
    </div>
  );
}
