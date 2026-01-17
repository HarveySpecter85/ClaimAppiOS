import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Upload, FileUp, Check, AlertCircle, X, Building } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import RoleGuard from "@/components/RoleGuard";
import { useUser } from "@/utils/useUser";

function EmployeeImportContent() {
  const { user } = useUser();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");

  const isGlobalAdmin = user?.system_role === "global_admin";

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
    enabled: isGlobalAdmin,
  });

  const parseFile = (file) => {
    setIsParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreviewData(results.data);
        setIsParsing(false);
      },
      error: (error) => {
        toast.error("Error parsing CSV: " + error.message);
        setIsParsing(false);
      },
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (
        selectedFile.type !== "text/csv" &&
        !selectedFile.name.endsWith(".csv")
      ) {
        toast.error("Please upload a CSV file");
        return;
      }
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        employees: data,
        client_id: isGlobalAdmin ? selectedClientId : undefined,
      };

      const res = await fetch("/api/employees/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Import failed");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(
        `Import complete: ${data.success} successful, ${data.failed} failed`,
      );
      if (data.failed > 0) {
        toast.error(
          "Some records failed to import. Check console for details.",
        );
        console.error("Import errors:", data.errors);
      }
      setFile(null);
      setPreviewData([]);
      setSelectedClientId("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Import Employees</h1>
        <p className="text-gray-500">Bulk create employees via CSV upload</p>
      </div>

      {isGlobalAdmin && (
        <div className="mb-8 bg-purple-50 p-6 rounded-xl border border-purple-100">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select Target Client
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                As a Global Admin, you must specify which client these employees
                belong to.
              </p>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full max-w-md px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              >
                <option value="">-- Select Client --</option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
        {!file ? (
          <div className="flex flex-col items-center py-12">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Upload size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Employee CSV
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm">
              Drag and drop your CSV file here, or click to browse. Ensure your
              CSV has headers: full_name, employee_id, job_position, email,
              phone.
            </p>
            <label className="cursor-pointer bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
              <input
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileChange}
              />
              Select File
            </label>
            <div className="mt-8 text-sm text-gray-400">
              <p>Supported format: .csv</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                  <FileUp size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {previewData.length} records found
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewData([]);
                }}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {previewData.length > 0 && (
              <div className="mb-6 border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b text-sm font-medium text-gray-500 text-left">
                  Preview (First 5 records)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white">
                      <tr>
                        {Object.keys(previewData[0] || {}).map((header) => (
                          <th
                            key={header}
                            className="px-4 py-2 border-b font-medium text-gray-700"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 5).map((row, i) => (
                        <tr
                          key={i}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-4 py-2 text-gray-600">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewData([]);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => importMutation.mutate(previewData)}
                disabled={
                  importMutation.isPending ||
                  previewData.length === 0 ||
                  (isGlobalAdmin && !selectedClientId)
                }
                className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importMutation.isPending ? "Importing..." : "Start Import"}
                {!importMutation.isPending && <Check size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmployeeImportPage() {
  return (
    <RoleGuard roles={["global_admin", "plant_supervisor"]}>
      <EmployeeImportContent />
    </RoleGuard>
  );
}
