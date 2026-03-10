import { Model } from "@/lib/model";

const settingSchema = {
  settingKey: {
    type: "VARCHAR(100)",
    required: true,
    unique: true,
  },
  value: {
    type: "TEXT",
    required: true,
  },
};

const Setting = new Model("settings", settingSchema);

export default Setting;
