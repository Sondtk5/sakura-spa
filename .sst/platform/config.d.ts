declare const sst: {
  aws: {
    StaticSite: new (
      name: string,
      args: {
        build: {
          command: string;
          output: string;
        };
      },
    ) => {
      url: string;
    };
  };
};

declare function $config(config: {
  app(input?: { stage?: string }): {
    name: string;
    home: string;
    removal: string;
    protect: boolean;
  };
  run(): Promise<Record<string, unknown>> | Record<string, unknown>;
}): unknown;
