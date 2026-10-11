import { formatDate, formatTime } from "./date";
import type { Workout } from "./types";
import { loggedExercises, workoutTitle } from "./workout";

interface ExportOptions {
  from: string;
  to: string;
  userName: string;
}

export async function exportWorkoutsPdf(workouts: Workout[], { from, to, userName }: ExportOptions) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont("helvetica", "bold").setFontSize(20).text("Repwise", margin, 50);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(90);
  doc.text(`Workout report: ${formatDate(from)} to ${formatDate(to)}`, margin, 68);
  if (userName) doc.text(userName, margin, 82);
  doc.setTextColor(0);

  let y = 110;
  for (const workout of workouts) {
    if (y > pageHeight - 120) {
      doc.addPage();
      y = 50;
    }
    doc.setFont("helvetica", "bold").setFontSize(13).text(workoutTitle(workout), margin, y);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(90);
    doc.text(`${formatDate(workout.date)} · ${formatTime(workout.startedAt)}`, margin, y + 14);
    doc.setTextColor(0);

    const body = loggedExercises(workout).flatMap((exercise) =>
      exercise.sets.map((set, i) => [
        i === 0 ? exercise.name : "",
        i === 0 ? exercise.targetPart : "",
        String(i + 1),
        `${set.weight} ${set.unit}`,
        String(set.reps),
      ]),
    );

    autoTable(doc, {
      startY: y + 24,
      margin: { left: margin, right: margin },
      head: [["Exercise", "Target", "Set", "Weight", "Reps"]],
      body,
      theme: "grid",
      styles: { fontSize: 9, textColor: 0, lineColor: 200 },
      headStyles: { fillColor: 0, textColor: 255 },
    });

    const table = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
    y = table.finalY + 36;
  }

  doc.save(`repwise-${from}_to_${to}.pdf`);
}
