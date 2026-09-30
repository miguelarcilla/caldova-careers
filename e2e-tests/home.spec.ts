import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive the expected posting count from the job content collection so this
// assertion stays correct as roles are added or removed.
const jobsDir = fileURLToPath(new URL('../src/content/jobs', import.meta.url));
const expectedRoleCount = readdirSync(jobsDir).filter((f) => f.endsWith('.md')).length;

test.describe('Open roles listing', () => {
    test('shows the roles grid with all postings', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

        const grid = page.getByTestId('roles-grid');
        await expect(grid).toBeVisible();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
    });

    test('searches roles by title, clears results, and shows the no-results state', async ({ page }) => {
        const searchInput = page.getByRole('searchbox', { name: 'Search roles by title' });
        const roleCards = page.getByTestId('role-card');
        const resultStatus = page.getByTestId('role-search-status');
        const noResults = page.getByTestId('role-search-empty');
        let roleTitles: string[] = [];

        await test.step('load the content-backed role titles', async () => {
            await page.goto('/');
            await expect(searchInput).toBeVisible();
            await expect(roleCards).toHaveCount(expectedRoleCount);
            roleTitles = (await page.getByTestId('role-title').allTextContents())
                .map((title) => title.trim());
        });

        const selectedTitle = roleTitles[0];
        if (selectedTitle === undefined) {
            throw new Error('Expected the home page to render at least one role title.');
        }

        const titleSubstring = selectedTitle.slice(0, Math.min(4, selectedTitle.length));
        const searchQuery = titleSubstring.toUpperCase() === titleSubstring
            ? titleSubstring.toLowerCase()
            : titleSubstring.toUpperCase();
        const matchingTitles = roleTitles.filter((title) =>
            title.toLowerCase().includes(searchQuery.toLowerCase()));

        await test.step('filter by a case-variant title substring', async () => {
            await searchInput.fill(searchQuery);
            for (let index = 0; index < roleTitles.length; index += 1) {
                if (matchingTitles.includes(roleTitles[index])) {
                    await expect(roleCards.nth(index)).toBeVisible();
                } else {
                    await expect(roleCards.nth(index)).toBeHidden();
                }
            }

            const matchCount = matchingTitles.length;
            await expect(resultStatus).toHaveText(
                `Showing ${matchCount} ${matchCount === 1 ? 'role' : 'roles'}.`,
            );
        });

        await test.step('check accessibility with search results populated', async () => {
            const results = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa'])
                .analyze();
            expect(results.violations).toEqual([]);
        });

        await test.step('clear the search and restore every role', async () => {
            await searchInput.clear();
            await expect(page.getByTestId('roles-grid')).toBeVisible();
            await expect(roleCards).toHaveCount(expectedRoleCount);
            for (let index = 0; index < roleTitles.length; index += 1) {
                await expect(roleCards.nth(index)).toBeVisible();
            }
            await expect(resultStatus).toHaveText(
                `Showing ${expectedRoleCount} ${expectedRoleCount === 1 ? 'role' : 'roles'}.`,
            );
        });

        let noMatchQuery = 'no matching role';
        while (roleTitles.some((title) =>
            title.toLowerCase().includes(noMatchQuery.toLowerCase()))) {
            noMatchQuery += 'x';
        }

        await test.step('show the dedicated state for a guaranteed nonmatch', async () => {
            await searchInput.fill(noMatchQuery);
            await expect(noResults).toBeVisible();
            await expect(noResults.getByRole('heading', { name: 'No roles found' })).toBeVisible();
            await expect(page.getByTestId('roles-grid')).toBeHidden();
            for (let index = 0; index < roleTitles.length; index += 1) {
                await expect(roleCards.nth(index)).toBeHidden();
            }
            await expect(resultStatus).toHaveText('No roles match your search.');
        });
    });

    test('links through to a role detail page', async ({ page }) => {
        await page.goto('/');
        const firstCard = page.getByTestId('role-card').first();
        const title = await firstCard.getByTestId('role-title').textContent();
        await firstCard.click();
        await expect(page.getByTestId('role-detail-title')).toHaveText(title!.trim());
        await expect(page.getByTestId('apply-form')).toBeVisible();
    });

    test('has no automatically detectable accessibility violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
