"use client";

import { useState } from "react";
import {
    X,
    FileUp,
    FileDown,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Loader2,
    Download
} from "lucide-react";
import styles from "./AdminImportModal.module.css";

interface AdminImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ImportStatus = 'idle' | 'parsing' | 'preview' | 'importing' | 'complete';

export default function AdminImportModal({ isOpen, onClose }: AdminImportModalProps) {
    const [status, setStatus] = useState<ImportStatus>('idle');
    const [previewData, setPreviewData] = useState<any[]>([]);

    if (!isOpen) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStatus('parsing');
        // Simulate parsing delay
        setTimeout(() => {
            setPreviewData([
                { id: 1, name: "John Doe", role: "Service", phone: "971501234567", camp: "Sonara", status: "success", msg: "Ready" },
                { id: 2, name: "Maria S.", role: "Bar", phone: "971529876543", camp: "NEST", status: "warning", msg: "Phone format adjusted" },
                { id: 3, name: "Invalid Emp", role: "", phone: "abc", camp: "Unknown", status: "error", msg: "Missing role" },
                { id: 4, name: "Elena P.", role: "Hostess", phone: "971584447777", camp: "Lady Nara", status: "success", msg: "Ready" },
            ]);
            setStatus('preview');
        }, 1500);
    };

    const handleImport = () => {
        setStatus('importing');
        setTimeout(() => {
            setStatus('complete');
            setTimeout(onClose, 2000);
        }, 2000);
    };

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
                            <input type="file" hidden onChange={handleFileUpload} accept=".csv" />
                            <div className={styles.dropzoneIcon}>
                                <FileUp size={24} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Click to upload or drag and drop</p>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Support .csv files only</p>
                            </div>
                        </label>
                    )}

                    {status === 'parsing' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '4rem' }}>
                            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
                            <p style={{ fontWeight: 600, color: '#475569' }}>Analyzing CSV data...</p>
                        </div>
                    )}

                    {(status === 'preview' || status === 'importing' || status === 'complete') && (
                        <>
                            <div className={styles.statsRow}>
                                <div className={`${styles.statCard} ${styles.statSuccess}`}>
                                    <CheckCircle2 size={18} />
                                    <span>2 Valid Rows</span>
                                </div>
                                <div className={`${styles.statCard} ${styles.statWarning}`}>
                                    <AlertCircle size={18} />
                                    <span>1 Warning</span>
                                </div>
                                <div className={`${styles.statCard} ${styles.statError}`}>
                                    <XCircle size={18} />
                                    <span>1 Error (Skipped)</span>
                                </div>
                            </div>

                            <div className={styles.previewScroll}>
                                <table className={styles.previewTable}>
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Phone</th>
                                            <th>Home Camp</th>
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
                                                <td style={{ fontWeight: 600 }}>{row.name}</td>
                                                <td>{row.role || '-'}</td>
                                                <td>{row.phone}</td>
                                                <td>{row.camp}</td>
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
                    <a href="#" className={styles.templateLink}>
                        <Download size={16} /> Download CSV Template
                    </a>
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
                                style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(124, 76, 44, 0.2)' }}
                            >
                                Import 3 Records
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
