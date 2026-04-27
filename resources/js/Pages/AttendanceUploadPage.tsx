import { Upload, FileSpreadsheet, Check, AlertCircle } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MainLayout from "@/layouts/MainLayout";


export default function AttendanceUploadPage() {
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadedData, setUploadedData] = useState<any[]>([]);

  const mockUploadedData = [
    { staffId: "EMP001", name: "Alice Johnson", daysPresent: 22, lateCount: 2, month: "October 2025", status: "Excellent" },
    { staffId: "EMP002", name: "Bob Williams", daysPresent: 21, lateCount: 3, month: "October 2025", status: "Good" },
    { staffId: "EMP003", name: "Carol Davis", daysPresent: 20, lateCount: 4, month: "October 2025", status: "Good" },
    { staffId: "EMP004", name: "David Brown", daysPresent: 19, lateCount: 5, month: "October 2025", status: "Fair" },
    { staffId: "EMP005", name: "Emma Wilson", daysPresent: 23, lateCount: 1, month: "October 2025", status: "Excellent" },
    { staffId: "EMP006", name: "Frank Miller", daysPresent: 18, lateCount: 6, month: "October 2025", status: "Fair" },
    { staffId: "EMP007", name: "Grace Lee", daysPresent: 22, lateCount: 2, month: "October 2025", status: "Excellent" },
    { staffId: "EMP008", name: "Henry Taylor", daysPresent: 21, lateCount: 3, month: "October 2025", status: "Good" },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate upload and processing
      setTimeout(() => {
        setUploadStatus("success");
        setUploadedData(mockUploadedData);
      }, 1000);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground mb-2">Attendance Upload</h1>
        <p className="text-muted-foreground">Upload and manage employee attendance records</p>
      </div>

      {/* Upload Section */}
      <Card className="bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Upload Attendance File</CardTitle>
          <CardDescription className="text-muted-foreground">
            Upload CSV or Excel file. System will automatically link attendance to staff IDs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-brand transition-colors">
              <input
                type="file"
                id="attendance-upload"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
              />
              <label htmlFor="attendance-upload" className="cursor-pointer">
                <div className="w-16 h-16 bg-brand-subtle dark:bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet className="w-8 h-8 text-brand" />
                </div>
                <h3 className="text-foreground mb-2">Choose file to upload</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  CSV or Excel format (Max 10MB)
                </p>
                <Button className="bg-brand hover:bg-brand/90 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Select File
                </Button>
              </label>
            </div>

            {uploadStatus === "success" && (
              <div className="flex items-center gap-3 p-4 bg-brand-subtle dark:bg-muted border border-brand rounded-lg">
                <Check className="w-5 h-5 text-brand" />
                <div>
                  <p className="text-foreground">File uploaded successfully</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadedData.length} records processed and linked to staff IDs
                  </p>
                </div>
              </div>
            )}

            {uploadStatus === "error" && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-red-900">Upload failed</p>
                  <p className="text-sm text-red-600">
                    Please check your file format and try again
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button className="bg-card border border-border text-foreground hover:bg-muted">
                Download Template
              </Button>
              <Button className="bg-card border border-border text-foreground hover:bg-muted">
                View Upload History
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Data Table */}
      {uploadedData.length > 0 && (
        <Card className="bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Uploaded Records</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Latest attendance data
                </CardDescription>
              </div>
              <Button className="bg-brand hover:bg-brand/90 text-white">
                Save to Database
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground">Staff ID</TableHead>
                  <TableHead className="text-foreground">Name</TableHead>
                  <TableHead className="text-foreground">Days Present</TableHead>
                  <TableHead className="text-foreground">Late Count</TableHead>
                  <TableHead className="text-foreground">Month</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedData.map((record) => (
                  <TableRow key={record.staffId}>
                    <TableCell className="text-muted-foreground">{record.staffId}</TableCell>
                    <TableCell className="text-foreground">{record.name}</TableCell>
                    <TableCell className="text-foreground">{record.daysPresent}</TableCell>
                    <TableCell className="text-foreground">{record.lateCount}</TableCell>
                    <TableCell className="text-muted-foreground">{record.month}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          record.status === "Excellent"
                            ? "bg-brand text-white"
                            : record.status === "Good"
                            ? "bg-brand-yellow text-foreground"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

AttendanceUploadPage.layout = (page: React.ReactNode) => <MainLayout children={page} />;
