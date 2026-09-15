import { describe, expect, it } from "bun:test";
import {
	CONTACT_ALLOWED_HOSTS,
	contactAllowedHosts,
	hostnameMatches,
	isAllowedOrigin,
	isLocalHostname,
} from "@/lib/contact/origin";

describe("contactAllowedHosts", () => {
	it("en producción solo permite los hosts del sitio", () => {
		const hosts = contactAllowedHosts(true);
		expect(isAllowedOrigin("https://renovabit.com", hosts)).toBe(true);
		expect(isAllowedOrigin("https://www.renovabit.com", hosts)).toBe(true);
		expect(isAllowedOrigin("http://localhost:4321", hosts)).toBe(false);
		expect(isAllowedOrigin("https://renovabit-landing.user.workers.dev", hosts)).toBe(false);
	});

	it("fuera de producción permite localhost y previews de workers.dev", () => {
		const hosts = contactAllowedHosts(false);
		expect(isAllowedOrigin("http://localhost:4321", hosts)).toBe(true);
		expect(isAllowedOrigin("http://127.0.0.1:8787", hosts)).toBe(true);
		expect(isAllowedOrigin("https://renovabit-landing.user.workers.dev", hosts)).toBe(true);
		expect(isAllowedOrigin("https://workers.dev", hosts)).toBe(false);
		expect(isAllowedOrigin("https://evil.example", hosts)).toBe(false);
	});
});

describe("isAllowedOrigin", () => {
	it("permite peticiones sin cabecera Origin", () => {
		expect(isAllowedOrigin(null, CONTACT_ALLOWED_HOSTS)).toBe(true);
	});

	it("compara sin distinguir mayúsculas", () => {
		expect(isAllowedOrigin("HTTPS://RENOVABIT.COM", CONTACT_ALLOWED_HOSTS)).toBe(true);
		expect(isAllowedOrigin("https://renovabit.com", ["RenovaBit.COM"])).toBe(true);
	});

	it("rechaza orígenes de otros sitios", () => {
		expect(isAllowedOrigin("https://evil.example", CONTACT_ALLOWED_HOSTS)).toBe(false);
		expect(isAllowedOrigin("https://renovabit.com.evil.example", CONTACT_ALLOWED_HOSTS)).toBe(
			false,
		);
	});

	it("rechaza valores que no son URLs", () => {
		expect(isAllowedOrigin("no-es-una-url", CONTACT_ALLOWED_HOSTS)).toBe(false);
	});
});

describe("hostnameMatches", () => {
	it("soporta el patrón de subdominio", () => {
		expect(hostnameMatches("renovabit-landing.user.workers.dev", "*.workers.dev")).toBe(true);
		expect(hostnameMatches("workers.dev", "*.workers.dev")).toBe(false);
		expect(hostnameMatches("evil.example", "*.workers.dev")).toBe(false);
	});

	it("compara el resto de patrones de forma exacta", () => {
		expect(hostnameMatches("renovabit.com", "renovabit.com")).toBe(true);
		expect(hostnameMatches("www.renovabit.com", "renovabit.com")).toBe(false);
		expect(hostnameMatches("RENOVABIT.COM", "renovabit.com")).toBe(true);
	});
});

describe("isLocalHostname", () => {
	it("detecta los hostnames locales", () => {
		expect(isLocalHostname("localhost")).toBe(true);
		expect(isLocalHostname("LOCALHOST")).toBe(true);
		expect(isLocalHostname("127.0.0.1")).toBe(true);
		expect(isLocalHostname("renovabit.com")).toBe(false);
	});
});
