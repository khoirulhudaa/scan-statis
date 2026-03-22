// src/hooks/useScannerState.ts
import { useState, useRef } from 'react';

export const useScannerState = () => {
  // ── Core states ────────────────────────────────────────────────────────
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | 'processing' | 'error'; msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'scan' | 'barcode' | 'history' | 'profile'>('scan');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [msg, setMsg] = useState<string>(''); // <--- TAMBAHKAN BARIS INI

  // ── Barcode tab ────────────────────────────────────────────────────────
  const [barcodeTab, setBarcodeTab] = useState<'nis' | 'nisn'>('nis');

  // ── History ────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Profile form & UI ──────────────────────────────────────────────────
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [form, setForm] = useState<any>({
    name: '',
    email: '',
    nis: '',
    nisn: '',
    nip: '',
    oldPassword: '',
    newPassword: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // ── User & School ──────────────────────────────────────────────────────
  const [userProfile, setUserProfile] = useState<any>(() =>
    JSON.parse(localStorage.getItem('user_profile') || '{}')
  );
  const [schoolId, setSchoolId] = useState<number | null>(null);

  // ── Home data states ───────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [tugas, setTugas] = useState<any[]>([]);
  const [osisData, setOsisData] = useState<any>(null);
  const [alumniData, setAlumniData] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState<{ [key: string]: boolean }>({});
  const [errorData, setErrorData] = useState<{ [key: string]: string }>({});

  // ── Announcement modal & QR login ──────────────────────────────────────
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const [showLoginQrScanner, setShowLoginQrScanner] = useState(false);
  const [loginQrStatus, setLoginQrStatus] = useState<'idle' | 'scanning' | 'processing' | 'success' | 'error'>('idle');
  const [loginQrMessage, setLoginQrMessage] = useState('');
  const [scannerActive, setScannerActive] = useState(false);

  // ── Ref untuk mencegah fetch berulang ──────────────────────────────────
  const hasFetchedHome = useRef(false);

  return {
    // Core
    msg, setMsg,
    status, setStatus,
    activeTab, setActiveTab,
    showLogoutConfirm, setShowLogoutConfirm,

    // Barcode
    barcodeTab, setBarcodeTab,

    // History
    history, setHistory,
    loadingHistory, setLoadingHistory,

    // Profile
    showOldPassword, setShowOldPassword,
    showNewPassword, setShowNewPassword,
    form, setForm,
    loadingProfile, setLoadingProfile,
    photoLoading, setPhotoLoading,
    preview, setPreview,

    // User & School
    userProfile, setUserProfile,
    schoolId, setSchoolId,

    // Home data
    announcements, setAnnouncements,
    news, setNews,
    tugas, setTugas,
    osisData, setOsisData,
    alumniData, setAlumniData,
    comments, setComments,
    avgRating, setAvgRating,
    loadingData, setLoadingData,
    errorData, setErrorData,

    // Modals & QR
    selectedAnnouncement, setSelectedAnnouncement,
    showLoginQrScanner, setShowLoginQrScanner,
    loginQrStatus, setLoginQrStatus,
    loginQrMessage, setLoginQrMessage,
    scannerActive, setScannerActive,

    // Ref
    hasFetchedHome,
  };
};