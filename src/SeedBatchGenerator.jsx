import { useState } from "react";
import * as XLSX from "xlsx";

function SeedBatchGenerator() {
  const [entries, setEntries] = useState([]);
  const [rawText, setRawText] = useState("");
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-GB").replace(/\//g, "/");
  const fileName = `SEEDS${today.toLocaleDateString("en-GB", { day: '2-digit', month: 'short' }).toUpperCase().replace(/ /g, "")}001.xlsx`;

  const parseAmount = (text) => {
    const clean = text.replace(/[^\d\.kml]/gi, "").toLowerCase();
    if (clean.includes("l")) return parseFloat(clean) * 100000;
    if (clean.includes("k")) return parseFloat(clean) * 1000;
    const num = clean.match(/\d+(\.\d+)?/);
    return num ? parseFloat(num[0]) : 0;
  };

  const parseRawText = () => {
    const blocks = rawText.trim().split(/\n{2,}|\r{2,}/);
    const results = [];

    for (const block of blocks) {
      const lines = block.split(/\r?\n|\r/).map(l => l.trim()).filter(Boolean);

      let name = "", acc = "", ifsc = "", amt = "";

      for (let line of lines) {
        const lower = line.toLowerCase();

        line = line.replace(/^name[:\-]?\s*/i, "")
                   .replace(/^a\/c\s*no[:\-]?\s*/i, "")
                   .replace(/^account\s*(number|no)?[:\-]?\s*/i, "")
                   .replace(/^ifsc(\s*code)?[:\-]?\s*/i, "")
                   .replace(/^amount[:\-]?\s*/i, "");
        line = line.replace(/\(.*?\)/g, "").trim();

        if (!acc && /\d{9,18}/.test(line)) acc = line.match(/\d{9,18}/)[0];
        if (!ifsc && /[A-Z]{4}0[A-Z0-9]{6}/i.test(line)) ifsc = line.match(/[A-Z]{4}0[A-Z0-9]{6}/i)[0].toUpperCase();
        if (!amt && /\d{2,}[kml]?(\/\-)?/.test(line)) amt = parseAmount(line);
        if (!name && !line.match(/\d{5,}/) && !line.match(/IFSC|amount|rs|bank|branch|mobile|code|a\/c|acc/i)) name = line;
      }

      if (name && acc && ifsc && amt) {
        results.push({
          "Beneficiary Name": name,
          "Beneficiary Account Number": acc,
          IFSC: ifsc,
          "Transaction Type": "NEFT",
          "Debit Account Number": "10225297219",
          "Transaction Date": dateStr,
          Amount: amt,
          Currency: "INR",
          "Beneficiary Email ID": "",
          Remarks: "",
          "Custom Header – 1": "",
          "Custom Header – 2": "",
          "Custom Header – 3": "",
          "Custom Header – 4": "",
          "Custom Header – 5": ""
        });
      }
    }

    if (results.length === 0) {
      alert("Could not auto-detect valid entries. Make sure name, A/C, IFSC, and amount are present.");
    } else {
      setEntries([...entries, ...results]);
      setRawText("");
    }
  };

  const downloadExcel = () => {
    if (entries.length === 0) {
      alert("No entries to export.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(entries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, fileName);
  };

  const newBatch = () => setEntries([]);

  return (
    <div className="p-4 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <div className="bg-indigo-600 text-white rounded-xl p-6 text-center shadow mb-6">
        <h1 className="text-3xl font-extrabold tracking-wide">OPTIMISM IDFC BULK PAYOUT</h1>
        <p className="text-sm font-light mt-1">Paste raw bank transfer details and generate Excel instantly</p>
      </div>

      <textarea
        className="w-full border border-indigo-300 rounded-lg p-3 mb-4 shadow-sm"
        rows={6}
        placeholder="Paste raw text with name, A/C, IFSC, and amount..."
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
      />

      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={parseRawText} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Add Entries</button>
        <button onClick={downloadExcel} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Download Excel</button>
        <button onClick={newBatch} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">New Batch</button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-300 shadow-sm">
          <thead className="bg-indigo-100">
            <tr>
              {entries.length > 0 && Object.keys(entries[0]).map((header, i) => (
                <th key={i} className="border px-2 py-1 text-left font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {Object.values(entry).map((val, i) => (
                  <td key={i} className="border px-2 py-1 text-gray-700">{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SeedBatchGenerator;
