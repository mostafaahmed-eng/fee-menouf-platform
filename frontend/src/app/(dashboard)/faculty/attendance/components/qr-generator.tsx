'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QrGeneratorProps {
  courses: { id: string; nameAr: string; code: string }[];
}

export default function QrGenerator({ courses }: QrGeneratorProps) {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [qrData, setQrData] = useState<string | null>(null);
  const [lectureTitle, setLectureTitle] = useState('');

  const generateQr = () => {
    if (!selectedCourse) return;
    const data = JSON.stringify({
      course_id: selectedCourse,
      lecture: lectureTitle || `محاضرة ${new Date().toLocaleDateString('ar-EG')}`,
      date: new Date().toISOString(),
      type: 'attendance',
    });
    setQrData(data);
  };

  const refreshQr = () => {
    setQrData(null);
    generateQr();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            رمز الاستجابة السريعة للحضور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>المادة</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المادة" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.nameAr} ({course.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>عنوان المحاضرة</Label>
            <Input
              value={lectureTitle}
              onChange={(e) => setLectureTitle(e.target.value)}
              placeholder="محاضرة 1 - ..."
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={generateQr} className="flex-1 gap-2" disabled={!selectedCourse}>
              <QrCode className="h-4 w-4" />
              إنشاء الرمز
            </Button>
            {qrData && (
              <Button variant="outline" onClick={refreshQr} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
            )}
          </div>
          {qrData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 rounded-lg border bg-muted/30 p-6"
            >
              <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-white p-4">
                <QrCode className="h-full w-full text-black" />
              </div>
              <p className="text-xs text-muted-foreground">
                رمز الحضور للمحاضرة - {new Date().toLocaleDateString('ar-EG')}
              </p>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                تحميل QR
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
