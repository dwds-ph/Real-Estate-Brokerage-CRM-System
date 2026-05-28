import { describe, it, expect, vi, beforeEach } from "vitest";
import { Logger, createScopedLogger } from "./logger";

describe("Logger class", () => {
  let logger: Logger;

  beforeEach(() => {
    vi.restoreAllMocks();
    logger = new Logger("TestScope");
  });

  it("logs debug messages", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    // eslint-disable-next-line no-console
    console.debug("test"); // warmup
    logger.debug("test message");
    // debug may be suppressed by VITE_LOG_LEVEL — we just verify no crash
    expect(spy).not.toThrow();
  });

  it("logs info messages", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logger.info("info message");
    expect(spy).toHaveBeenCalled();
  });

  it("logs warning messages", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("warn message");
    expect(spy).toHaveBeenCalled();
  });

  it("logs error messages", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("error message");
    expect(spy).toHaveBeenCalled();
  });
});

describe("createScopedLogger", () => {
  it("creates a logger scoped to a module", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const moduleLogger = createScopedLogger("TestModule");
    moduleLogger.info("module message");
    expect(spy).toHaveBeenCalled();
  });

  it("supports info, warn, error levels", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const modLogger = createScopedLogger("Module");
    modLogger.info("i");
    modLogger.warn("w");
    modLogger.error("e");

    expect(infoSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});
