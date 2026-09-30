import { describe, it, expect } from 'vitest';
import { sortByNewest, formatPostedDate, titleMatchesQuery, filterByTitle } from './jobs';
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

describe('titleMatchesQuery', () => {
    it('matches exact and partial title text', () => {
        expect(titleMatchesQuery('Senior Research Scientist', 'Senior Research Scientist')).toBe(true);
        expect(titleMatchesQuery('Senior Research Scientist', 'Research')).toBe(true);
    });

    it('matches without regard to case', () => {
        expect(titleMatchesQuery('Senior Research Scientist', 'sEnIoR rEsEaRcH')).toBe(true);
    });

    it('trims surrounding whitespace from the title and query', () => {
        expect(titleMatchesQuery(' Senior Research Scientist ', '  Research  ')).toBe(true);
    });

    it('treats empty and whitespace-only queries as matches', () => {
        expect(titleMatchesQuery('Senior Research Scientist', '')).toBe(true);
        expect(titleMatchesQuery('Senior Research Scientist', '   \t ')).toBe(true);
    });

    it('returns false when the title does not contain the query', () => {
        expect(titleMatchesQuery('Senior Research Scientist', 'Engineer')).toBe(false);
    });

    it('treats punctuation in the query literally', () => {
        expect(titleMatchesQuery('C++ Engineer', 'C++')).toBe(true);
    });
});

describe('filterByTitle', () => {
    const researchJob = { ...makeJob('research', '2027-01-01'), title: 'Research Scientist' };
    const engineeringJob = { ...makeJob('engineering', '2027-02-01'), title: 'Software Engineer' };
    const seniorResearchJob = { ...makeJob('senior-research', '2027-03-01'), title: 'Senior Research Scientist' };

    it('returns exact and substring matches in their original order', () => {
        const jobs = [researchJob, engineeringJob, seniorResearchJob];
        const filtered = filterByTitle(jobs, 'Research Scientist');

        expect(filtered).toEqual([researchJob, seniorResearchJob]);
        expect(filtered[0]).toBe(researchJob);
        expect(filtered[1]).toBe(seniorResearchJob);
    });

    it('matches titles case-insensitively', () => {
        const jobs = [researchJob, engineeringJob];
        const filtered = filterByTitle(jobs, 'sOFTWARE');

        expect(filtered).toEqual([engineeringJob]);
        expect(filtered[0]).toBe(engineeringJob);
    });

    it('returns all jobs in order for empty and whitespace-only queries', () => {
        const jobs = [researchJob, engineeringJob, seniorResearchJob];

        for (const query of ['', ' \t  ']) {
            const filtered = filterByTitle(jobs, query);
            expect(filtered).toEqual(jobs);
            expect(filtered).toHaveLength(jobs.length);
            filtered.forEach((job, index) => expect(job).toBe(jobs[index]));
        }
    });

    it('returns an empty array when no titles match', () => {
        expect(filterByTitle([researchJob, engineeringJob], 'Designer')).toEqual([]);
    });

    it('returns an empty array for an empty jobs array', () => {
        expect(filterByTitle([], 'Research')).toEqual([]);
        expect(filterByTitle([], '')).toEqual([]);
    });

    it('matches literal punctuation in titles', () => {
        const cplusplusJob = { ...makeJob('cplusplus', '2027-01-01'), title: 'C++ Engineer' };
        const jobs = [cplusplusJob, researchJob];
        const filtered = filterByTitle(jobs, 'C++');

        expect(filtered).toEqual([cplusplusJob]);
        expect(filtered[0]).toBe(cplusplusJob);
    });

    it('does not mutate the input array', () => {
        const jobs = [researchJob, engineeringJob, seniorResearchJob];
        const originalJobs = [...jobs];

        filterByTitle(jobs, 'Research');

        expect(jobs).toEqual(originalJobs);
        jobs.forEach((job, index) => expect(job).toBe(originalJobs[index]));
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
