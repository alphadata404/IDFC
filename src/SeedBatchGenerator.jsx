import { useState } from "react";
import * as XLSX from "xlsx";

function SeedBatchGenerator() {
  const [entries, setEntries] = useState([]);
  const [rawText, setRawText] = useState("");
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-GB").replace(/\//g, "/");
  const fileName = `SEEDS${today.toLocaleDateString("en-GB", { day: '2-digit', month: 'short' }).toUpperCase().replace(/ /g, "")}001.xlsx`;

  const parseAmount = (str) => {
    const clean = str.replace(/[₹,\/-]/g, "").toLowerCase();
    if (clean.includes("l")) return parseFloat(clean) * 100000;
    if (clean.includes("k")) return parseFloat(clean) * 1000;
    const num = clean.match(/\d+(\.\d+)?/);
    return num ? parseFloat(num[0]) : 0;
  };

  const parseRawText = () => {
    const blocks = rawText.trim().split(/\n{2,}|\r{2,}/);
    const parsed = [];

    for (const block of blocks) {
      let name = "", account = "", ifsc = "", amount = "";
      const lines = block.split(/\r?\n|\r/).map(l => l.trim().replace(/\(.*?\)/g, "")).filter(Boolean);

      for (const line of lines) {
        const lower = line.toLowerCase();

        if (!name && /name|acc name|beneficiary/i.test(lower)) {
          name = line.split(/[:\-]/).pop().trim();
        }

        if (!account && /account|a\/c|acc no|ac no/i.test(lower)) {
          const match = line.match(/\d{9,18}/);
          if (match) account = match[0];
        }

        if (!ifsc && /ifsc/.test(lower)) {
          const match = line.match(/[A-Z]{4}0[A-Z0-9]{6}/i);
          if (match) ifsc = match[0].toUpperCase();
        }

        if (!amount && /(amount|rs|inr|₹|\d+[kml])/i.test(lower)) {
          amount = parseAmount(line);
        }

        if (!account && /^\d{9,18}$/.test(line)) account = line;
        if (!ifsc && /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(line)) ifsc = line.toUpperCase();
        if (!amount && /\d+[kml]?/i.test(line)) amount = parseAmount(line);

        if (!name && /^(?!ifsc|account|amount|rs|bank|branch|swift|mobile|acc|a\/c|holder)/i.test(lower)) {
          if (!/^\d+$/.test(line) && !line.match(/\d+[kml]/i)) name = line;
        }

        if (!account && line.match(/^\d{9,18}.*:-/)) {
          const match = line.match(/^\d{9,18}/);
          if (match) account = match[0];
          const namePart = line.split(/[:-]/).pop();
          if (namePart && !name) name = namePart.trim();
        }

        if (!name && line.toLowerCase().includes("customer name")) {
          name = line.split(/[:\-]/).pop().trim();
        }
      }

      if (name && account && ifsc && amount) {
        parsed.push({
          "Beneficiary Name": name,
          "Beneficiary Account Number": account,
          IFSC: ifsc,
          "Transaction Type": "NEFT",
          "Debit Account Number": "10225297219",
          "Transaction Date": dateStr,
          Amount: amount,
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

    if (parsed.length === 0) {
      alert("Could not auto-detect valid entries. Make sure to include name, A/C, IFSC, and amount.");
    } else {
      setEntries([...entries, ...parsed]);
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
