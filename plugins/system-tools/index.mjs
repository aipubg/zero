/**
 * System Tools Plugin for Project Zero (Hermes-compatible)
 */

export default {
  name: "system-tools",
  description: "Windows system process and shell automation tools",

  async on_startup(context = {}) {
    context?.logger?.info?.("[system-tools] System tools plugin initialized");
  },

  register_tools(registerFn) {
    registerFn({
      name: "system_info",
      description: "Get Windows OS environment, memory status, and running process info.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      async execute() {
        return {
          ok: true,
          platform: "win32",
          arch: process.arch,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
        };
      },
    });
  },
};
