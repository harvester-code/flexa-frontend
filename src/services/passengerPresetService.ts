import { createAPIService } from "@/lib/axios";
import {
  PassengerPreset,
  PassengerPresetListResponse,
  CreatePassengerPresetParams,
  UpdatePassengerPresetParams,
} from "@/types/passengerPresetTypes";

const api = createAPIService("passenger-presets");

export const listPassengerPresets = () => {
  return api.get<PassengerPresetListResponse>("");
};

export const createPassengerPreset = (params: CreatePassengerPresetParams) => {
  return api.post<PassengerPreset>("", params);
};

export const updatePassengerPreset = (
  preset_id: string,
  params: UpdatePassengerPresetParams
) => {
  return api.put(`/${preset_id}`, params);
};

export const deletePassengerPreset = (preset_id: string) => {
  return api.delete(`/${preset_id}`);
};
