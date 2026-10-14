import { get, put } from './client';
import type {
  CompanyProfileResponse,
  CompanyProfileRequestDto,
  UpdateCompanyProfileRequest,
} from '../types';

export const companyProfileApi = {
  /** Live profile + any change request currently under review. */
  get: () => get<CompanyProfileResponse>('/company/profile'),

  /** Submit proposed profile values for platform approval (does not change the live profile). */
  update: (data: UpdateCompanyProfileRequest) =>
    put<CompanyProfileResponse>('/company/profile', data),

  /** The company's own profile-change history. */
  history: () => get<CompanyProfileRequestDto[]>('/company/profile/requests'),
};
