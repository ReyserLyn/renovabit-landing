/// <reference types="google.maps" />
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { LOCATION } from "@/constants";

const MAP_ID = "8335aededd74f006504e2f6e";
const PIN_SIZE = 48;

const PIN_SVG = `
	<svg viewBox="0 0 1024 1024" width="${PIN_SIZE * 0.65}" height="${PIN_SIZE * 0.65}" aria-hidden="true">
		<path d="M923.35,567.12c-13.77-21.23-30.13-37.59-49.08-49.07-18.95-11.49-36.15-18.95-51.66-22.4v-6.88c13.79-4.01,27.99-11.61,42.62-22.81,14.63-11.2,27.13-26.12,37.46-44.76,10.32-18.66,15.5-42.05,15.5-70.18s-7.48-54.95-22.4-78.77c-14.92-23.82-36.58-42.91-65-57.25-28.4-14.34-63.27-21.54-104.6-21.54h-294.43v119.14l66.91,5.65,54.51,72.45-21.92,80.66-34.76,38.14-64.74,10.27v167.88l45.69,15.55,57.94,127.37h197.7c49.92,0,90.53-8.9,121.8-26.7,31.28-17.78,53.95-40.46,68.02-68,14.06-27.56,21.09-56.25,21.09-86.11,0-33.85-6.88-61.41-20.65-82.63ZM564.33,304.52h139.48c29.84,0,51.66,7.32,65.43,21.95,13.77,14.63,20.67,32,20.67,52.1s-6.9,38.18-20.67,52.51c-13.77,14.36-35.59,21.54-65.43,21.54h-139.48v-148.09ZM787.75,694.96c-15.23,16.36-39.77,24.54-73.61,24.54h-149.81v-10.76h-3.5s-34.26-14.79-37.33-17.35-23.52-37.84-24.03-41.42c-.51-3.58-7.67-28.12-7.67-28.12l15.34-16.36,31.19-22.5,26,5v-33.8h149.81c33.85,0,58.39,8.06,73.61,24.11,15.19,16.07,22.81,35.31,22.81,57.69s-7.62,42.62-22.81,58.98Z" fill="$fill"/>
		<path d="M589.2,730.67l69.85,99.88h-155.72l-162.84-232.91-62.51-85.64h157.94c26.03,0,48.49-9.34,67.4-28.25,18.69-18.69,28.25-41.15,28.25-67.18s-9.57-48.72-28.25-67.4c-18.91-18.91-41.38-28.25-67.4-28.25H80l60.51-127.47h295.42c59.39,0,110.56,20.47,153.27,61.62,1.34,1.11,2.89,2.67,4.23,4,43.6,43.6,65.63,96.1,65.63,157.5,0,47.16-13.57,89.87-40.71,127.69-8.9,12.46-18.69,23.8-29.14,33.81-21.35,20.69-46.04,36.04-74.07,46.72l74.07,105.89Z" fill="$accent"/>
		<polygon points="454.84 830.56 299.12 830.56 213.03 705.31 179.66 656.82 169.87 642.8 80 512 233.27 512 287.11 589.41 292.89 597.64 340.49 666.16 373.42 713.32 373.86 715.32 373.86 714.21 454.84 830.56" fill="$accent"/>
	</svg>`;

function renderPin(isDark: boolean): string {
	const fill = isDark ? "#e8e9ff" : "#1a1a36";
	const accent = isDark ? "#a48fff" : "#654fcc";
	const bg = isDark ? "#070311" : "#f9f8ff";
	const s = PIN_SIZE;

	return `
		<div style="position:relative;width:${s}px;height:${s}px">
			<div style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:${s * 0.6}px;height:4px;background:rgba(0,0,0,0.2);border-radius:50%;filter:blur(2px)"></div>
			<div style="position:relative;width:${s}px;height:${s}px;border-radius:50%;box-shadow:0 4px 6px rgba(0,0,0,0.1);border:2px solid ${accent};background:${bg};overflow:hidden">
				<div style="position:absolute;inset:2px;display:flex;align-items:center;justify-content:center">
					${PIN_SVG.replace("$fill", fill).replace("$accent", accent)}
				</div>
			</div>
			<div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${accent}"></div>
		</div>`;
}

let optionsSet = false;
let observer: IntersectionObserver | null = null;

function initMap(el: HTMLDivElement, apiKey: string): void {
	const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

	if (!optionsSet) {
		setOptions({ key: apiKey, v: "beta" });
		optionsSet = true;
	}

	importLibrary("maps")
		.then(() => importLibrary("marker"))
		.then(() => {
			const map = new google.maps.Map(el, {
				center: { lat: LOCATION.lat, lng: LOCATION.lng },
				zoom: 16,
				mapId: MAP_ID,
				gestureHandling: "cooperative",
				disableDefaultUI: true,
				colorScheme: isDark ? "DARK" : "LIGHT",
			});

			const pinEl = document.createElement("div");
			pinEl.innerHTML = renderPin(isDark);

			new google.maps.marker.AdvancedMarkerElement({
				map,
				position: { lat: LOCATION.lat, lng: LOCATION.lng },
				content: pinEl,
			});
		})
		.catch(console.error);
}

export function MapRenovaBit() {
	const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined;

	if (!apiKey) {
		return (
			<div className="flex h-full w-full items-center justify-center rounded-2xl bg-muted/10">
				<p className="text-sm text-muted-foreground">Mapa no disponible</p>
			</div>
		);
	}

	return (
		<div
			ref={(el) => {
				if (!el) return;
				observer = new IntersectionObserver(
					(entries) => {
						for (const entry of entries) {
							if (entry.isIntersecting) {
								initMap(el, apiKey);
								observer?.disconnect();
								observer = null;
							}
						}
					},
					{ rootMargin: "400px" },
				);
				observer.observe(el);
			}}
			role="img"
			aria-label="Ubicación de RenovaBit en Av. Goyeneche 1602, Miraflores, Arequipa"
			className="h-full w-full rounded-2xl"
			style={{ minHeight: "256px" }}
		/>
	);
}
