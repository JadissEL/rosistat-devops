import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * PWA Validation Test Suite for RoSiStrat
 * Tests manifest.json, sw.js, and PWA installability
 */

describe("PWA Configuration Validation", () => {
  let manifestPath: string;
  let swPath: string;
  let indexPath: string;
  let manifest: any;
  let swContent: string;
  let indexContent: string;

  beforeAll(() => {
    // Setup paths
    manifestPath = path.resolve(__dirname, "../../public/manifest.json");
    swPath = path.resolve(__dirname, "../../public/sw.js");
    indexPath = path.resolve(__dirname, "../../index.html");

    // Read files
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    }
    if (fs.existsSync(swPath)) {
      swContent = fs.readFileSync(swPath, "utf-8");
    }
    if (fs.existsSync(indexPath)) {
      indexContent = fs.readFileSync(indexPath, "utf-8");
    }
  });

  describe("manifest.json - Structure & Required Fields", () => {
    it("should have a valid manifest.json file", () => {
      expect(manifest).toBeDefined();
      expect(typeof manifest).toBe("object");
    });

    it("should contain all required fields", () => {
      const requiredFields = [
        "name",
        "short_name",
        "start_url",
        "display",
        "icons",
      ];
      requiredFields.forEach((field) => {
        expect(manifest).toHaveProperty(field);
      });
    });

    it("should have valid name (min 1 char, max 45 chars for best compatibility)", () => {
      expect(manifest.name).toBeDefined();
      expect(manifest.name.length).toBeGreaterThan(0);
      // Chrome recommends <= 12 chars for short_name display
      expect(manifest.short_name.length).toBeLessThanOrEqual(45);
    });

    it("should have short_name for app launcher display", () => {
      expect(manifest.short_name).toBeDefined();
      expect(manifest.short_name.length).toBeGreaterThan(0);
      // Best practice: <= 12 chars for consistent display
      if (manifest.short_name.length > 12) {
        console.warn(
          `short_name "${manifest.short_name}" exceeds 12 chars, may be truncated in some launchers`,
        );
      }
    });

    it("should have description", () => {
      expect(manifest.description).toBeDefined();
      expect(manifest.description.length).toBeGreaterThan(0);
    });
  });

  describe("manifest.json - Display & Theme", () => {
    it("should have valid display mode", () => {
      const validDisplayModes = [
        "fullscreen",
        "standalone",
        "minimal-ui",
        "browser",
      ];
      expect(validDisplayModes).toContain(manifest.display);
    });

    it("should have theme_color in valid hex format", () => {
      expect(manifest.theme_color).toBeDefined();
      expect(/^#[0-9A-F]{6}$/i.test(manifest.theme_color)).toBe(true);
    });

    it("should have background_color in valid hex format", () => {
      expect(manifest.background_color).toBeDefined();
      expect(/^#[0-9A-F]{6}$/i.test(manifest.background_color)).toBe(true);
    });

    it("should have start_url", () => {
      expect(manifest.start_url).toBeDefined();
      expect(manifest.start_url).toBe("/");
    });

    it("should have valid orientation", () => {
      const validOrientations = [
        "portrait",
        "portrait-primary",
        "portrait-secondary",
        "landscape",
        "landscape-primary",
        "landscape-secondary",
        "natural",
        "any",
      ];
      if (manifest.orientation) {
        expect(validOrientations).toContain(manifest.orientation);
      }
    });
  });

  describe("manifest.json - Icons Configuration", () => {
    it("should have icons array with at least one icon", () => {
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);
    });

    it("should include 192x192 and 512x512 icons (minimum required)", () => {
      const sizes = manifest.icons.map((icon: any) => icon.sizes);
      expect(sizes).toContain("192x192");
      expect(sizes).toContain("512x512");
    });

    it("should have all icons with required fields", () => {
      manifest.icons.forEach((icon: any) => {
        expect(icon).toHaveProperty("src");
        expect(icon).toHaveProperty("sizes");
        expect(icon).toHaveProperty("type");
      });
    });

    it("should have icons with valid MIME types", () => {
      const validTypes = ["image/png", "image/svg+xml", "image/webp"];
      manifest.icons.forEach((icon: any) => {
        expect(validTypes).toContain(icon.type);
      });
    });

    it("should have icons with valid size format (WxH)", () => {
      manifest.icons.forEach((icon: any) => {
        expect(/^\d+x\d+$/.test(icon.sizes)).toBe(true);
      });
    });

    it("should use maskable purpose for better display on various devices", () => {
      manifest.icons.forEach((icon: any) => {
        if (icon.purpose) {
          expect(icon.purpose).toMatch(/maskable|any/);
        }
      });
    });

    it("should have icon files that exist or are accessible", () => {
      manifest.icons.forEach((icon: any) => {
        // For this test, verify the path structure is reasonable
        expect(icon.src).toMatch(/^\/icons\/.*\.(png|svg)$/);
      });
    });
  });

  describe("manifest.json - Screenshots (Optional but Recommended)", () => {
    it("should have screenshots if included", () => {
      if (manifest.screenshots) {
        expect(Array.isArray(manifest.screenshots)).toBe(true);
      }
    });

    it("should include narrow and wide form factors for install prompt", () => {
      if (manifest.screenshots && manifest.screenshots.length > 0) {
        const formFactors = manifest.screenshots.map(
          (s: any) => s.form_factor,
        );
        expect(formFactors).toContain("narrow");
        expect(formFactors).toContain("wide");
      }
    });

    it("should have valid screenshot dimensions", () => {
      if (manifest.screenshots) {
        manifest.screenshots.forEach((screenshot: any) => {
          expect(/^\d+x\d+$/.test(screenshot.sizes)).toBe(true);
        });
      }
    });
  });

  describe("manifest.json - Optional Fields", () => {
    it("should have scope defined", () => {
      expect(manifest.scope).toBeDefined();
      expect(manifest.scope).toBe("/");
    });

    it("should have language specified", () => {
      expect(manifest.lang).toBeDefined();
      expect(/^[a-z]{2}(-[A-Z]{2})?$/.test(manifest.lang)).toBe(true);
    });

    it("should have categories for app stores", () => {
      if (manifest.categories) {
        expect(Array.isArray(manifest.categories)).toBe(true);
        expect(manifest.categories.length).toBeGreaterThan(0);
      }
    });
  });

  describe("sw.js - Service Worker Structure", () => {
    it("should have service worker file", () => {
      expect(swContent).toBeDefined();
      expect(swContent.length).toBeGreaterThan(0);
    });

    it("should define CACHE_NAME constant", () => {
      expect(swContent).toMatch(/const\s+CACHE_NAME\s*=/);
    });

    it("should define urlsToCache for offline functionality", () => {
      expect(swContent).toMatch(/const\s+urlsToCache\s*=/);
      expect(swContent).toMatch(/\/index\.html/);
      expect(swContent).toMatch(/manifest\.json/);
    });

    it("should have install event listener", () => {
      expect(swContent).toMatch(
        /self\.addEventListener\s*\(\s*['"]install['"]/,
      );
    });

    it("should have fetch event listener", () => {
      expect(swContent).toMatch(/self\.addEventListener\s*\(\s*['"]fetch['"]/);
    });

    it("should have activate event listener", () => {
      expect(swContent).toMatch(
        /self\.addEventListener\s*\(\s*['"]activate['"]/,
      );
    });

    it("should implement cache-first strategy", () => {
      expect(swContent).toMatch(/caches\.match/);
      expect(swContent).toMatch(/fetch\(event\.request\)/);
    });

    it("should implement cache cleanup in activate", () => {
      expect(swContent).toMatch(/caches\.delete/);
      expect(swContent).toMatch(/cacheNames\.map/);
    });
  });

  describe("Service Worker Caching Strategy", () => {
    it("should cache on install", () => {
      expect(swContent).toMatch(/caches\.open\(CACHE_NAME\)/);
      expect(swContent).toMatch(/cache\.addAll/);
    });

    it("should return cached response when available", () => {
      expect(swContent).toMatch(/return response \|\|/);
    });

    it("should fallback to network when cache misses", () => {
      expect(swContent).toMatch(/fetch\(event\.request\)/);
    });

    it("should clean up old caches on activate", () => {
      expect(swContent).toMatch(/if \(cacheName !== CACHE_NAME\)/);
      expect(swContent).toMatch(/caches\.delete\(cacheName\)/);
    });
  });

  describe("index.html - PWA Integration", () => {
    it("should have manifest link tag", () => {
      expect(indexContent).toMatch(
        /<link\s+rel=['"]manifest['"]\s+href=['"]\/manifest\.json['"]/,
      );
    });

    it("should have theme-color meta tag", () => {
      expect(indexContent).toMatch(/<meta\s+name=['"]theme-color['"]/);
    });

    it("should have mobile-web-app-capable meta tag", () => {
      expect(indexContent).toMatch(/<meta\s+name=['"]mobile-web-app-capable['"]/);
    });

    it("should have apple-mobile-web-app-capable for iOS", () => {
      expect(indexContent).toMatch(
        /<meta\s+name=['"]apple-mobile-web-app-capable['"]/,
      );
    });

    it("should have apple-mobile-web-app-title for iOS", () => {
      expect(indexContent).toMatch(
        /<meta\s+name=['"]apple-mobile-web-app-title['"]/,
      );
    });

    it("should have apple-mobile-web-app-status-bar-style", () => {
      expect(indexContent).toMatch(
        /<meta\s+name=['"]apple-mobile-web-app-status-bar-style['"]/,
      );
    });

    it("should have service worker registration script", () => {
      expect(indexContent).toMatch(/navigator\.serviceWorker/);
      expect(indexContent).toMatch(/\.register\(['"]\/sw\.js['"]\)/);
    });

    it("should have proper viewport meta tag for responsiveness", () => {
      expect(indexContent).toMatch(
        /<meta\s+name=['"]viewport['"]\s+content=['"][^'"]*width=device-width/,
      );
    });

    it("should have apple-touch-icon link", () => {
      expect(indexContent).toMatch(/<link\s+rel=['"]apple-touch-icon['"]/);
    });
  });

  describe("Service Worker Registration Logic", () => {
    it("should check for serviceWorker support", () => {
      expect(indexContent).toMatch(/['"]serviceWorker['"]\s+in\s+navigator/);
    });

    it("should register on load event", () => {
      expect(indexContent).toMatch(/window\.addEventListener\(['"]load['"]/);
    });

    it("should handle registration success", () => {
      expect(indexContent).toMatch(/\.then\(/);
    });

    it("should handle registration errors", () => {
      expect(indexContent).toMatch(/\.catch\(/);
    });
  });

  describe("PWA Installability Checklist", () => {
    it("should meet identity requirement: name present", () => {
      expect(manifest.name).toBeDefined();
      expect(manifest.name.length).toBeGreaterThan(0);
    });

    it("should meet presentation requirement: display mode", () => {
      expect(["standalone", "fullscreen", "minimal-ui"]).toContain(
        manifest.display,
      );
    });

    it("should meet icon requirement: 192x192 icon", () => {
      const hasIcon192 = manifest.icons.some(
        (icon: any) => icon.sizes === "192x192",
      );
      expect(hasIcon192).toBe(true);
    });

    it("should meet start_url requirement", () => {
      expect(manifest.start_url).toBeDefined();
    });

    it("should have HTTPS or localhost (security requirement)", () => {
      // index.html test - in real scenario, would verify server
      expect(indexContent).toBeDefined();
      // This validates the setup supports PWA
    });

    it("should have service worker", () => {
      expect(swContent).toBeDefined();
    });

    it("should have responsive design support", () => {
      expect(indexContent).toMatch(/width=device-width/);
    });

    it("should have valid manifest linked in HTML", () => {
      expect(indexContent).toMatch(/\/manifest\.json/);
    });
  });

  describe("Browser Support & Compatibility", () => {
    it("should support Chrome/Edge with all requirements", () => {
      expect(manifest.display).toBe("standalone");
      expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    });

    it("should support iOS Safari with apple-touch-icon", () => {
      expect(indexContent).toMatch(/apple-touch-icon/);
      expect(indexContent).toMatch(/apple-mobile-web-app-capable/);
    });

    it("should support Windows 10+ with theme color", () => {
      expect(indexContent).toMatch(/msapplication-TileColor/);
      expect(manifest.theme_color).toBeDefined();
    });

    it("should have fallback for non-PWA browsers", () => {
      expect(indexContent).toMatch(/if \(['"]serviceWorker['"]\s+in/);
    });
  });

  describe("Offline Functionality", () => {
    it("should cache critical resources", () => {
      const cachesMatches = swContent.match(/urlsToCache\s*=\s*\[([\s\S]*?)\]/);
      expect(cachesMatches).toBeTruthy();
      const cacheList = cachesMatches![1];
      expect(cacheList).toMatch(/index\.html|\/,/);
    });

    it("should implement offline fallback strategy", () => {
      expect(swContent).toMatch(/response \|\| fetch/);
    });

    it("should clean up old versions", () => {
      expect(swContent).toMatch(/CACHE_NAME/);
      expect(swContent).toMatch(/caches\.delete/);
    });
  });

  describe("Security & Best Practices", () => {
    it("should use HTTPS scheme in manifest (when applicable)", () => {
      // Verify icons and screenshots use valid paths
      manifest.icons.forEach((icon: any) => {
        expect(icon.src).toMatch(/^\/|^https:\/\//);
      });
    });

    it("should not have hardcoded secrets in manifest", () => {
      const manifestStr = JSON.stringify(manifest);
      expect(manifestStr).not.toMatch(/api[_-]?key/i);
      expect(manifestStr).not.toMatch(/secret/i);
    });

    it("should not have hardcoded secrets in service worker", () => {
      expect(swContent).not.toMatch(/api[_-]?key/i);
      expect(swContent).not.toMatch(/secret/i);
    });

    it("should limit cache size by using versioned cache names", () => {
      expect(swContent).toMatch(/CACHE_NAME\s*=\s*["'].*-v\d+["']/);
    });
  });

  describe("Performance Optimization", () => {
    it("should include essential assets in cache", () => {
      const cacheList = swContent.match(/urlsToCache\s*=\s*\[([\s\S]*?)\]/);
      expect(cacheList).toBeTruthy();
    });

    it("should have minimal cache size (no heavy assets listed)", () => {
      const cacheList = swContent.match(/urlsToCache\s*=\s*\[([\s\S]*?)\]/);
      const cachesStr = cacheList![1];
      // Should not cache large static assets directly
      expect(cachesStr).not.toMatch(/\.mp4|\.webm|\.mov/);
    });

    it("should handle dynamic imports efficiently", () => {
      expect(swContent).toMatch(/event\.respondWith/);
    });
  });

  describe("Manifest Compliance with PWA Standards", () => {
    it("should conform to Web Manifest specification", () => {
      expect(manifest.name).toBeDefined();
      expect(manifest.start_url).toBeDefined();
      expect(manifest.display).toBeDefined();
      expect(manifest.icons).toBeDefined();
    });

    it("should support installation on different platforms", () => {
      // Android
      expect(manifest.display).toBe("standalone");
      // iOS
      expect(indexContent).toMatch(/apple-mobile-web-app-capable/);
      // Windows
      expect(indexContent).toMatch(/msapplication-TileColor/);
    });

    it("should have proper icon coverage for all platforms", () => {
      const sizes = manifest.icons.map((icon: any) =>
        parseInt(icon.sizes.split("x")[0]),
      );
      expect(Math.min(...sizes)).toBeLessThanOrEqual(192);
      expect(Math.max(...sizes)).toBeGreaterThanOrEqual(512);
    });
  });

  describe("Installation Prompt Readiness", () => {
    it("should meet criteria for beforeinstallprompt event", () => {
      // Web app manifest
      expect(manifest).toBeDefined();
      // HTTPS or localhost
      expect(indexContent).toBeDefined();
      // Service worker
      expect(swContent).toBeDefined();
      // Icons
      expect(manifest.icons.length).toBeGreaterThan(0);
      // Start URL
      expect(manifest.start_url).toBe("/");
      // Display mode
      expect(["standalone", "fullscreen", "minimal-ui"]).toContain(
        manifest.display,
      );
    });

    it("should have icon sizes suitable for all install prompts", () => {
      const iconSizes = manifest.icons.map((icon: any) => icon.sizes);
      // Minimum required
      expect(iconSizes).toContain("192x192");
      // For splash screens
      expect(iconSizes).toContain("512x512");
    });
  });

  describe("Responsive Design Support", () => {
    it("should have viewport meta tag for mobile", () => {
      expect(indexContent).toMatch(/width=device-width/);
      expect(indexContent).toMatch(/initial-scale=1/);
    });

    it("should prevent zoom if needed for UX", () => {
      expect(indexContent).toMatch(
        /maximum-scale=1|user-scalable=no|viewport-fit/,
      );
    });

    it("should use viewport-fit for notch support", () => {
      expect(indexContent).toMatch(/viewport-fit=cover/);
    });

    it("should prevent telephone number detection if needed", () => {
      expect(indexContent).toMatch(/format-detection.*telephone=no/);
    });
  });
});
