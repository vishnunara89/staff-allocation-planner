// Manning Templates - Hardcoded Excel rules for venues

export interface ManningTemplate {
    name: string;
    departments: ('service' | 'bar' | 'all')[];
    configs: {
        [dept: string]: {
            brackets: string[];
            rows: { role: string; counts: number[] }[];
        };
    };
}

export const MANNING_TEMPLATES: ManningTemplate[] = [
    {
        name: 'Custom',
        departments: ['all'],
        configs: {
            all: {
                brackets: ['0-50'],
                rows: []
            }
        }
    },
    {
        name: 'SONARA (Dubai + RAK)',
        departments: ['service', 'bar'],
        configs: {
            service: {
                brackets: ['20-40', '40-80', '80-120', '120-160', '160-200', '200-240', '240-280', '280-320'],
                rows: [
                    { role: 'Manager', counts: [1, 1, 1, 1, 1, 1, 1, 1] },
                    { role: 'Assistant Manager', counts: [1, 1, 1, 2, 2, 2, 2, 2] },
                    { role: 'Head Waiter', counts: [1, 2, 3, 3, 3, 3, 3, 3] },
                    { role: 'Waiter', counts: [3, 5, 5, 6, 8, 8, 10, 10] },
                    { role: 'Runner', counts: [3, 4, 6, 9, 11, 13, 14, 16] },
                    { role: 'Shisha Operator', counts: [1, 2, 2, 2, 2, 3, 3, 3] }
                ]
            },
            bar: {
                brackets: ['20-40', '40-80', '80-120', '120-160', '160-200', '200-240', '240-280', '280-320'],
                rows: [
                    { role: 'Manager', counts: [1, 1, 1, 1, 1, 1, 1, 1] },
                    { role: 'Head Bartender', counts: [1, 1, 1, 1, 1, 1, 1, 1] },
                    { role: 'Bartender', counts: [1, 2, 2, 2, 2, 2, 3, 3] },
                    { role: 'Barback', counts: [1, 1, 1, 2, 2, 3, 3, 3] }
                ]
            }
        }
    },
    {
        name: 'NEST',
        departments: ['all'],
        configs: {
            all: {
                brackets: ['2-10', '10-20', '20-30', '30-40', '40-50'],
                rows: [
                    { role: 'Manager', counts: [0, 1, 1, 1, 1] },
                    { role: 'Assistant Manager', counts: [1, 0, 1, 1, 1] },
                    { role: 'Waiter', counts: [1, 1, 1, 2, 2] },
                    { role: 'Runner', counts: [0, 1, 2, 2, 2] },
                    { role: 'Housekeeper', counts: [3, 4, 5, 5, 6] },
                    { role: 'Bartender', counts: [1, 1, 1, 1, 1] }
                ]
            }
        }
    },
    {
        name: 'LADY NARA',
        departments: ['service', 'bar'],
        configs: {
            service: {
                brackets: ['10-20', '20-30', '30-40', '40-50', '50-60', '60-70'],
                rows: [
                    { role: 'Manager', counts: [1, 1, 1, 1, 1, 1] },
                    { role: 'Head Waiter', counts: [1, 2, 2, 2, 3, 3] },
                    { role: 'Runner', counts: [1, 1, 2, 2, 2, 3] }
                ]
            },
            bar: {
                brackets: ['10-20', '20-30', '30-40', '40-50', '50-60', '60-70'],
                rows: [
                    { role: 'Head Bartender', counts: [1, 1, 1, 1, 1, 1] },
                    { role: 'Bartender', counts: [0, 0, 0, 0, 1, 1] }
                ]
            }
        }
    },
    {
        name: 'RAMADAN',
        departments: ['all'],
        configs: {
            all: {
                brackets: ['0-20', '20-50', '50-80', '80-120'],
                rows: [
                    { role: 'Manager', counts: [1, 1, 1, 1] },
                    { role: 'Supervisor', counts: [0, 1, 1, 1] },
                    { role: 'Waiter', counts: [2, 3, 4, 6] },
                    { role: 'Runner', counts: [1, 4, 4, 4] },
                    { role: 'Bartender', counts: [1, 1, 2, 2] },
                    { role: 'Barback', counts: [1, 2, 1, 3] }
                ]
            }
        }
    }
];

export function getTemplateByName(name: string): ManningTemplate | undefined {
    return MANNING_TEMPLATES.find(t => t.name === name);
}
