"use client";

import { useState, useRef } from 'react';
import styles from '../app/staff/staff.module.css';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ count?: number; error?: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const CSV_TEMPLATE = `full_name,primary_role,secondary_roles,english_proficiency,other_languages,special_skills,experience_tags,home_base_venue,employment_type,availability_status,notes
John Doe,Server,Bartender,fluent,"French,Spanish","First Aid,VIP Service",,Sonara Camp,internal,available,Experienced server
Jane Smith,Bartender,,good,Russian,"Sommelier,Mixology",,Desert Rose,internal,available,
Ahmed Ali,Manager,,fluent,"Arabic,French",Leadership,,Sonara Camp,internal,available,5 years experience
Maria Garcia,Server,,intermediate,Spanish,,,Desert Rose,freelance,available,Part-time availability`;

    const downloadTemplate = () => {
        const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'staff_import_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/staff/import', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Import failed');

            setResult({ count: data.count });
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);

        } catch (err: any) {
            setResult({ error: err.message });
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <div className="modal-header-title">
                        <h3>Bulk Import Staff</h3>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <p style={{ marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        Import multiple staff members at once using a CSV file.
                        Please ensure your file matches our template for a smooth import.
                    </p>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <button
                            onClick={downloadTemplate}
                            className={styles.buttonSecondary}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download CSV Template
                        </button>
                    </div>

                    <div
                        className={styles.formGroup}
                        style={{
                            border: '2px dashed #e2e8f0',
                            borderRadius: '12px',
                            padding: '2rem',
                            textAlign: 'center',
                            background: file ? '#f0fdf4' : '#f8fafc',
                            borderColor: file ? '#22c55e' : '#e2e8f0',
                            transition: 'all 0.2s'
                        }}
                    >
                        <input
                            type="file"
                            accept=".csv"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                        />
                        <div onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                                {file ? '📄' : '📤'}
                            </div>
                            <div style={{ fontWeight: '600', color: file ? '#166534' : '#475569' }}>
                                {file ? file.name : 'Click to select CSV file'}
                            </div>
                            {!file && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>or drag and drop here</div>}
                        </div>
                    </div>

                    {result && (
                        <div
                            style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                borderRadius: '10px',
                                background: result.error ? '#fef2f2' : '#f0fdf4',
                                color: result.error ? '#991b1b' : '#166534',
                                border: `1px solid ${result.error ? '#fee2e2' : '#dcfce7'}`,
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {result.error ? (
                                <>
                                    <span>⚠️</span>
                                    {result.error}
                                </>
                            ) : (
                                <>
                                    <span>✅</span>
                                    Success! Imported {result.count} staff members.
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button type="button" className={styles.buttonSecondary} onClick={onClose}>Cancel</button>
                    <button
                        onClick={handleUpload}
                        className={styles.buttonPrimary}
                        disabled={!file || uploading}
                    >
                        {uploading ? 'Importing...' : 'Upload & Import'}
                    </button>
                </div>
            </div>
        </div>
    );
}
