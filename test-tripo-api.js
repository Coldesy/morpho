async function main() {
    try {
        console.log("Calling /api/models/tripo...");
        const res = await fetch('http://localhost:3000/api/models/tripo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ concept: "apple" })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (e) {
        console.error(e);
    }
}
main();
