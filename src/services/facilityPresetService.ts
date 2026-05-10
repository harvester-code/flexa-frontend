import { createAPIService } from "@/lib/axios";
import {
  FacilityPreset,
  FacilityPresetListResponse,
  CreateFacilityPresetParams,
  UpdateFacilityPresetParams,
} from "@/types/facilityPresetTypes";

const api = createAPIService("facility-presets");

export const listFacilityPresets = () => {
  return api.get<FacilityPresetListResponse>("");
};

export const createFacilityPreset = (params: CreateFacilityPresetParams) => {
  return api.post<FacilityPreset>("", params);
};

export const updateFacilityPreset = (
  preset_id: string,
  params: UpdateFacilityPresetParams
) => {
  return api.put(`/${preset_id}`, params);
};

export const deleteFacilityPreset = (preset_id: string) => {
  return api.delete(`/${preset_id}`);
};
