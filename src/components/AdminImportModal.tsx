"use client";

import { useState, useEffect, useRef } from "react";
import {
    X,
    FileUp,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Loader2,
    Download
} from "lucide-react";
import styles from "./AdminImportModal.module.css";
import * as XLSX from "xlsx";
import { downloadCSVTemplate } from "@/lib/staff-utils";

interface AdminImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

type ImportStatus = 'idle' | 'parsing' | 'preview' | 'importing' | 'complete';

export default function AdminImportModal({ isOpen, onClose, onSuccess }: AdminImportModalProps) {
    const [status, setStatus] = useState<ImportStatus>('idle');
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [venues, setVenues] = useState<string[]>([]);
    const [stats, setStats] = useState({ valid: 0, warnings: 0, errors: 0 });
    const [importResult, setImportResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            fetchLookups();
        } else {
            // Reset state on close
            setStatus('idle');
            setPreviewData([]);
            setSelectedFile(null);
            setImportResult(null);
        }
    }, [isOpen]);

    const fetchLookups = async () => {
        try {
            const [rolesRes, venuesRes] = await Promise.all([
                fetch('/api/roles').then(r => r.json()),
                fetch('/api/venues').then(r => r.json())
            ]);
            if (Array.isArray(rolesRes)) setRoles(rolesRes.map((r: any) => r.name.toLowerCase()));
            if (Array.isArray(venuesRes)) setVenues(venuesRes.map((v: any) => v.name.toLowerCase()));
        } catch (err) {
            console.error('Failed to fetch lookups:', err);
        }
    };

    const validateRow = (row: any) => {
        const name = row.full_name || '';
        const role = (row.primary_role || '').toLowerCase().trim();
        const venue = (row.home_base_venue || '').toLowerCase().trim();

        if (!name || name.trim() === '') {
            return { status: 'error', msg: 'Missing name - will be skipped' };
        }

        if (role && !roles.includes(role)) {
            return { status: 'warning', msg: `Role "${row.primary_role}" not recognized, will use default` };
        }

        if (venue && !venues.includes(venue)) {
            return { status: 'warning', msg: `Venue "${row.home_base_venue}" not recognized` };
        }

        return { status: 'success', msg: 'Ready' };
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setStatus('parsing');

        try {
            let rows: any[] = [];
            const fileName = file.name.toLowerCase();

            if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                rows = XLSX.utils.sheet_to_json(firstSheet);
            } else {
                const text = await file.text();
                const lines = text.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
                if (lines.length > 1) {
                    const splitCSV = (str: string) => {
                        const result = [];
                        let current = '';
                        let inQuotes = false;
                        for (let i = 0; i < str.length; i++) {
                            if (str[i] === '"') inQuotes = !inQuotes;
                            else if (str[i] === ',' && !inQuotes) {
                                result.push(current.trim().replace(/^"|"$/g, ''));
                                current = '';
                            } else current += str[i];
                        }
                        result.push(current.trim().replace(/^"|"$/g, ''));
                        return result;
                    };

                    const headers = splitCSV(lines[0]);
                    for (let i = 1; i < lines.length; i++) {
                        const cols = splitCSV(lines[i]);
                        const rowData: any = {};
                        headers.forEach((h, idx) => rowData[h] = cols[idx] || '');
                        rows.push(rowData);
                    }
                }
            }

            const validated = rows.map((row, idx) => {
                const validation = validateRow(row);
                return {
                    ...row,
                    id: idx,
                    status: validation.status,
                    msg: validation.msg
                };
            });

            setPreviewData(validated);
            setStats({
                valid: validated.filter(r => r.status === 'success').length,
                warnings: validated.filter(r => r.status === 'warning').length,
                errors: validated.filter(r => r.status === 'error').length
            });
            setStatus('preview');
        } catch (err) {
            console.error('Parsing failed:', err);
            alert('Failed to parse file');
            setStatus('idle');
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;
        setStatus('importing');

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await fetch('/api/staff/import', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Import failed');

            setImportResult(data);
            setStatus('complete');
            if (onSuccess) onSuccess();
            setTimeout(onClose, 2500);
        } catch (err: any) {
            console.error('Import failed:', err);
            alert(err.message || 'Import failed');
            setStatus('preview');
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.container} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Bulk Employee Import</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.body}>
                    {status === 'idle' && (
                        <label className={styles.dropzone}>
                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".csv, .xlsx, .xls"
                            />
                            <div className={styles.dropzoneIcon}>
                                <FileUp size={24} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Click to upload or drag and drop</p>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Support .csv, .xlsx, .xls files</p>
                            </div>
                        </label>
                    )}

                    {status === 'parsing' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '4rem' }}>
                            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
                            <p style={{ fontWeight: 600, color: '#475569' }}>Analyzing file data...</p>
                        </div>
                    )}

                    {(status === 'preview' || status === 'importing' || status === 'complete') && (
                        <>
                            <div className={styles.statsRow}>
                                <div className={`${styles.statCard} ${styles.statSuccess}`}>
                                    <CheckCircle2 size={18} />
                                    <span>{stats.valid} Valid Rows</span>
                                </div>
                                {stats.warnings > 0 && (
                                    <div className={`${styles.statCard} ${styles.statWarning}`}>
                                        <AlertCircle size={18} />
                                        <span>{stats.warnings} Warnings</span>
                                    </div>
                                )}
                                {stats.errors > 0 && (
                                    <div className={`${styles.statCard} ${styles.statError}`}>
                                        <XCircle size={18} />
                                        <span>{stats.errors} Errors (Skipped)</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.previewScroll}>
                                <table className={styles.previewTable}>
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Phone</th>
                                            <th>Home Base</th>
                                            <th>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.map(row => (
                                            <tr key={row.id}>
                                                <td>
                                                    <div className={styles.statusIcon}>
                                                        {row.status === 'success' && <CheckCircle2 size={16} color="#166534" />}
                                                        {row.status === 'warning' && <AlertCircle size={16} color="#92400e" />}
                                                        {row.status === 'error' && <XCircle size={16} color="#b91c1c" />}
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: 600 }}>{row.full_name || '-'}</td>
                                                <td>{row.primary_role || '-'}</td>
                                                <td>{row.phone_number || '-'}</td>
                                                <td>{row.home_base_venue || '-'}</td>
                                                <td style={{ fontSize: '0.75rem', color: row.status === 'error' ? '#b91c1c' : '#64748b' }}>{row.msg}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.footer}>
                    <button onClick={downloadCSVTemplate} className={styles.templateLink} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7c4c2c' }}>
                        <Download size={16} /> Download CSV Template
                    </button>
                    <div className={styles.actionBtns}>
                        <button
                            className="button-secondary"
                            onClick={onClose}
                            style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        {(status === 'preview') && (
                            <button
                                className="button-primary"
                                onClick={handleImport}
                                disabled={stats.valid === 0 && stats.warnings === 0}
                                style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(124, 76, 44, 0.2)', opacity: (stats.valid === 0 && stats.warnings === 0) ? 0.5 : 1 }}
                            >
                                Import {stats.valid + stats.warnings} Records
                            </button>
                        )}
                        {status === 'importing' && (
                            <button className="button-primary" disabled style={{ background: '#cbd5e1', color: '#94a3b8', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Loader2 size={16} className="animate-spin" /> Importing...
                            </button>
                        )}
                        {status === 'complete' && (
                            <button className="button-primary" style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle2 size={16} /> Done!
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
