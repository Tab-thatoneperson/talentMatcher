import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompanyRepository } from './company.repository';

const mockCompany = {
  id: 'comp-1',
  organizationName: 'Acme Corp',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('CompaniesService', () => {
  let service: CompaniesService;
  let repo: { findById: jest.Mock; update: jest.Mock; delete: jest.Mock };

  beforeEach(async () => {
    repo = {
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: CompanyRepository, useValue: repo },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  describe('getById', () => {
    it('returns the company', async () => {
      repo.findById.mockResolvedValue(mockCompany);

      const result = await service.getById('comp-1');

      expect(result.organizationName).toBe('Acme Corp');
    });

    it('throws NotFoundException when company does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates company when caller is admin of that company', async () => {
      repo.findById.mockResolvedValue({ ...mockCompany, organizationName: 'New Name' });

      const result = await service.update(
        'comp-1',
        true,
        'comp-1',
        { organizationName: 'New Name' },
      );

      expect(repo.update).toHaveBeenCalledWith('comp-1', { organizationName: 'New Name' });
      expect(result.organizationName).toBe('New Name');
    });

    it('throws ForbiddenException when caller is not admin', async () => {
      await expect(
        service.update('comp-1', false, 'comp-1', { organizationName: 'Hack' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when admin tries to update a different company', async () => {
      await expect(
        service.update('comp-1', true, 'comp-2', { organizationName: 'Hack' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('deletes company when caller is admin of that company', async () => {
      await service.delete('comp-1', true, 'comp-1');

      expect(repo.delete).toHaveBeenCalledWith('comp-1');
    });

    it('throws ForbiddenException when caller is not admin', async () => {
      await expect(service.delete('comp-1', false, 'comp-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when admin tries to delete a different company', async () => {
      await expect(service.delete('comp-1', true, 'comp-2')).rejects.toThrow(ForbiddenException);
    });
  });
});
