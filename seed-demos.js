const DEMOS = [
    'Human Heart',
    'Solar System',
    'Taj Mahal',
    'Volcano',
];

async function seed() {
    console.log('Seeding demo cache...');
    for (const d of DEMOS) {
        console.log(`\nFetching: ${d}`);
        try {
            const res = await fetch('http://localhost:3000/api/pipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: d })
            });
            const data = await res.json();
            if (data.cached) {
                console.log(`✅ ${d} was already cached.`);
            } else if (res.ok) {
                console.log(`✅ Successfully generated and cached: ${d}`);
            } else {
                console.error(`❌ Failed: ${data.error}`);
            }
        } catch (e) {
            console.error(`❌ Error fetching ${d}:`, e);
            console.log('Is the Next.js server running on port 3000?');
            break;
        }
    }
}

seed();
