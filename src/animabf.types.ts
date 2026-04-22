import { ABFConfig } from './module/ABFConfig';
import { ABFItemsEnum } from './module/items/ABFItems';

export type ABFItemBaseDataSource<
  D extends Record<string, any>,
  K extends keyof D = keyof D
> = {
  _id: string;

  type: ABFItemsEnum;
  name: string;

  system: D;

  updateSource?: (data: D) => void;
} & {
  [key in K]: D[K];
};

declare global {
  interface CONFIG {
    config: typeof ABFConfig;
  }
}
