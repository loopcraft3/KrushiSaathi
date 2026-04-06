const API_BASE = `http://${window.location.hostname}:5000`;

export type PredictRequest = {
    Temperature: number;
    Humidity: number;
    Moisture: number;
    Nitrogen: number;
    Phosphorous: number;
    Potassium: number;
    Soil_Type: string;
    Crop_Type: string;
};

export type PredictResponse = {
    fertilizer: string;
    confidence: string; // High | Medium | Low
    information: string;
    safety_notes: string;
    input_data: Record<string, unknown>;
};

export async function getSoilTypes(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/soil-types`);
    if (!res.ok) throw new Error(`Soil types failed: ${res.status}`);
    const data = await res.json();
    return data.soil_types ?? [];
}

export async function getCropTypes(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/crop-types`);
    if (!res.ok) throw new Error(`Crop types failed: ${res.status}`);
    const data = await res.json();
    return data.crop_types ?? [];
}

export async function predictFertilizer(payload: PredictRequest): Promise<PredictResponse> {
    const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Predict failed: ${res.status}`);
    }
    return res.json();
}


