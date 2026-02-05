"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../staff.module.css';

export default function ImportStaffPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const CSV_TEMPLATE = `staff_id,full_name,primary_role,secondary_roles,english_proficiency,other_languages,special_skills,experience_tags,home_base_venue,employment_type,availability_status,notes
1,John Doe,Waiter,"Bartender",fluent,"French,Spanish","First Aid",,Sonara Camp,full_time,available,
2,Jane Smith,Bartender,,intermediate,Russian,,Sommelier,,freelance,available,`;

    function downloadTemplate() {
        const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'staff_import_template.csv';
        a.click();
    }

    async function handleUpload() {
        if (!file) return;
        setUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Note: Since we are in a browser environment, we might need a server-side route to parse the file 
            // OR parse it client side. Given the user requirement "Accept file upload", sending to API is safer for validation across environments.
            // However, sticking to the existing project patterns, let's see if there is an import API.
            // If not, we'll parse client-side and send JSON to /api/staff/batch (which we might need to create) 
            // OR just parse here and call /api/staff loop.
            // Let's assume we need to parse client-side for now to avoid server file handling complexity unless requested.

            const text = await file.text();
            const rows = text.split('\n').map(r => r.trim()).filter(r => r);
            const headers = rows[0].split(',');

            // Basic validation
            if (!headers.includes('full_name') || !headers.includes('primary_role')) {
                throw new Error('Invalid CSV headers. Please use the template.');
            }

            // Simple parsing (naive CSV parser, adequate for simple data)
            // Real CSV parsing should handle quotes. For now, we'll suggest user uses the template.
            // Actually, let's implement a slightly smarter split that respects quotes if possible, 
            // or just warn the user.

            const parsedStaff = [];
            for (let i = 1; i < rows.length; i++) {
                // very basic comma split, assuming no commas in values for MVP fix
                // Improving this would use a library like PapaParse, but avoiding deps for now.
                const cols = rows[i].split(',');
                // Mapping by index based on template order:
                // staff_id(0), full_name(1), primary_role(2)...
                if (cols.length < 3) continue;

                parsedStaff.push({
                    full_name: cols[1],
                    primary_role_name: cols[2], // Will need to map to ID on server or here
                    // ... other fields mapping would happen here
                    // Ideally, we send this raw data to an API endpoint that handles the mapping logic.
                });
            }

            // Since we need to look up Role IDs and Venue IDs, doing this entirely client-side is heavy.
            // Let's create an API route /api/staff/import to handle this properly.

            const res = await fetch('/api/staff/import', {
                method: 'POST',
                body: formData // Sending file directly is cleaner if API supports it
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Import failed');

            setResult(data);
            if (data.success) {
                setTimeout(() => router.push('/staff'), 2000);
            }

        } catch (err: any) {
            setResult({ error: err.message });
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Import Staff CSV</h2>
                <Link href="/staff" className={styles.buttonSecondary}>Back</Link>
            </div>

            <div className={styles.card} style={{ maxWidth: '600px', margin: '2rem auto' }}>
                <p>Upload a CSV file to bulk import staff members. Use the template below to ensure correct formatting.</p>

                <div style={{ margin: '1rem 0' }}>
                    <button onClick={downloadTemplate} className={styles.buttonSecondary}>
                        ⬇ Download CSV Template
                    </button>
                </div>

                <div className={styles.formGroup}>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                </div>

                {result && (
                    <div className={result.error ? "error" : "success"} style={{ margin: '1rem 0', padding: '1rem', background: result.error ? '#fee' : '#efe' }}>
                        {result.error ? result.error : `Success! Imported ${result.count} staff members.`}
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    className={styles.buttonPrimary}
                    disabled={!file || uploading}
                >
                    {uploading ? 'Importing...' : 'Upload & Import'}
                </button>
            </div>
        </div>
    );
}
