import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import type { Transcription } from '@/types';
import type { TranscriptionAnalysis } from '@/types/analysis';
import { formatTimestamp, formatDate } from '@/utils/formatters';

export type ExportFormat = 'txt' | 'pdf' | 'docx' | 'srt' | 'vtt' | 'json';

export async function exportTranscription(
  transcription: Transcription,
  analysis: TranscriptionAnalysis | undefined,
  format: ExportFormat,
  options: { includeTimestamps?: boolean; includeSpeakers?: boolean; includeAnalysis?: boolean } = {}
): Promise<void> {
  const { includeTimestamps = true, includeSpeakers = true, includeAnalysis = true } = options;

  switch (format) {
    case 'txt': return downloadText(transcription, analysis, includeTimestamps, includeSpeakers, includeAnalysis);
    case 'pdf': return downloadPDF(transcription, analysis, includeTimestamps, includeSpeakers, includeAnalysis);
    case 'docx': return downloadDOCX(transcription, analysis, includeTimestamps, includeSpeakers, includeAnalysis);
    case 'srt': return downloadSRT(transcription);
    case 'vtt': return downloadVTT(transcription);
    case 'json': return downloadJSON(transcription, analysis);
  }
}

function buildPlainText(t: Transcription, a: TranscriptionAnalysis | undefined, ts: boolean, sp: boolean, an: boolean): string {
  let text = `${t.title}\n${'='.repeat(t.title.length)}\nDate: ${formatDate(t.createdAt)}\nMode: ${t.mode}\nLanguage: ${t.language}\n\n`;

  text += '--- TRANSCRIPT ---\n\n';
  for (const seg of t.segments) {
    let line = '';
    if (ts) line += `[${formatTimestamp(seg.start)}] `;
    if (sp && seg.speaker) line += `${seg.speaker}: `;
    line += seg.text;
    text += line + '\n\n';
  }

  if (an && a) {
    text += '\n--- ANALYSIS ---\n\n';
    text += `Summary:\n${a.summary}\n\n`;
    if (a.actionItems.length > 0) {
      text += 'Action Items:\n';
      a.actionItems.forEach((item, i) => { text += `${i + 1}. ${item.text}${item.owner ? ` (${item.owner})` : ''}\n`; });
      text += '\n';
    }
    if (a.decisions.length > 0) {
      text += 'Decisions:\n';
      a.decisions.forEach((d, i) => { text += `${i + 1}. ${d.text}\n`; });
      text += '\n';
    }
    if (a.meetingMinutes) {
      text += 'Meeting Minutes:\n';
      text += `Title: ${a.meetingMinutes.title}\n`;
      text += `Attendees: ${a.meetingMinutes.attendees.join(', ')}\n`;
      text += `Next Steps: ${a.meetingMinutes.nextSteps.join('; ')}\n`;
    }
  }

  return text;
}

function downloadText(t: Transcription, a: TranscriptionAnalysis | undefined, ts: boolean, sp: boolean, an: boolean) {
  const text = buildPlainText(t, a, ts, sp, an);
  download(text, `${t.title}.txt`, 'text/plain');
}

function downloadPDF(t: Transcription, a: TranscriptionAnalysis | undefined, ts: boolean, sp: boolean, an: boolean) {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  doc.setFontSize(18);
  doc.text(t.title, margin, y);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${formatDate(t.createdAt)} | Mode: ${t.mode} | Language: ${t.language}`, margin, y);
  y += 12;
  doc.setTextColor(0);

  doc.setFontSize(14);
  doc.text('Transcript', margin, y);
  y += 8;
  doc.setFontSize(10);

  for (const seg of t.segments) {
    let line = '';
    if (ts) line += `[${formatTimestamp(seg.start)}] `;
    if (sp && seg.speaker) line += `${seg.speaker}: `;
    line += seg.text;

    const lines = doc.splitTextToSize(line, pageWidth);
    if (y + lines.length * 5 > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin, y);
    y += lines.length * 5 + 3;
  }

  if (an && a) {
    doc.addPage();
    y = margin;
    doc.setFontSize(14);
    doc.text('Analysis', margin, y);
    y += 8;
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(a.summary, pageWidth);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 5 + 5;

    if (a.actionItems.length > 0) {
      doc.setFontSize(12);
      doc.text('Action Items', margin, y);
      y += 6;
      doc.setFontSize(10);
      a.actionItems.forEach((item, i) => {
        const txt = `${i + 1}. ${item.text}${item.owner ? ` (${item.owner})` : ''}`;
        const l = doc.splitTextToSize(txt, pageWidth);
        if (y + l.length * 5 > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
        doc.text(l, margin, y);
        y += l.length * 5 + 2;
      });
    }
  }

  doc.save(`${t.title}.pdf`);
}

async function downloadDOCX(t: Transcription, a: TranscriptionAnalysis | undefined, ts: boolean, sp: boolean, an: boolean) {
  const children: Paragraph[] = [
    new Paragraph({ text: t.title, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: `${formatDate(t.createdAt)} | Mode: ${t.mode}`, color: '888888', size: 20 })] }),
    new Paragraph({}),
    new Paragraph({ text: 'Transcript', heading: HeadingLevel.HEADING_1 }),
  ];

  for (const seg of t.segments) {
    const runs: TextRun[] = [];
    if (ts) runs.push(new TextRun({ text: `[${formatTimestamp(seg.start)}] `, color: '888888', size: 18 }));
    if (sp && seg.speaker) runs.push(new TextRun({ text: `${seg.speaker}: `, bold: true, size: 22 }));
    runs.push(new TextRun({ text: seg.text, size: 22 }));
    children.push(new Paragraph({ children: runs, spacing: { after: 120 } }));
  }

  if (an && a) {
    children.push(new Paragraph({ text: 'Analysis', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: a.summary, spacing: { after: 200 } }));

    if (a.actionItems.length > 0) {
      children.push(new Paragraph({ text: 'Action Items', heading: HeadingLevel.HEADING_2 }));
      a.actionItems.forEach((item) => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `- ${item.text}` }),
            item.owner ? new TextRun({ text: ` (${item.owner})`, italics: true, color: '666666' }) : new TextRun(''),
          ],
        }));
      });
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  download(blob, `${t.title}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

function downloadSRT(t: Transcription) {
  let srt = '';
  t.segments.forEach((seg, i) => {
    srt += `${i + 1}\n`;
    srt += `${toSRTTime(seg.start)} --> ${toSRTTime(seg.end)}\n`;
    srt += `${seg.speaker ? `${seg.speaker}: ` : ''}${seg.text}\n\n`;
  });
  download(srt, `${t.title}.srt`, 'text/plain');
}

function downloadVTT(t: Transcription) {
  let vtt = 'WEBVTT\n\n';
  t.segments.forEach((seg) => {
    vtt += `${toVTTTime(seg.start)} --> ${toVTTTime(seg.end)}\n`;
    vtt += `${seg.speaker ? `<v ${seg.speaker}>` : ''}${seg.text}\n\n`;
  });
  download(vtt, `${t.title}.vtt`, 'text/vtt');
}

function downloadJSON(t: Transcription, a: TranscriptionAnalysis | undefined) {
  download(JSON.stringify({ transcription: t, analysis: a }, null, 2), `${t.title}.json`, 'application/json');
}

function toSRTTime(s: number): string {
  const h = Math.floor(s / 3600).toString().padStart(2, '0');
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  const ms = Math.floor((s % 1) * 1000).toString().padStart(3, '0');
  return `${h}:${m}:${sec},${ms}`;
}

function toVTTTime(s: number): string {
  return toSRTTime(s).replace(',', '.');
}

function download(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
