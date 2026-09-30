import { describe, it, expect } from 'vitest';
import { getCareersSummary, sortByNewest, formatPostedDate } from './jobs';
import type { Job } from '../types/job';

function makeJob(slug: string, postedDate: string): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department: 'Technology',
        location: 'Remote',
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('getCareersSummary', () => {
    it('counts roles and distinct hiring departments without mutating jobs', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-02-01'),
            { ...makeJob('c', '2027-03-01'), department: 'Research & Development' },
        ];

        expect(getCareersSummary(jobs)).toEqual({ totalRoles: 3, departmentCount: 2 });
        expect(jobs.map((job) => job.department)).toEqual([
            'Technology',
            'Technology',
            'Research & Development',
        ]);
    });

    it('returns zero counts when no roles are open', () => {
        expect(getCareersSummary([])).toEqual({ totalRoles: 0, departmentCount: 0 });
    });
});

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-03-15'),
            makeJob('c', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('a', '2027-01-01'), makeJob('b', '2027-03-15')];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});
