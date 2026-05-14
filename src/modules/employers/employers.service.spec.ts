import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EmployersService } from './employers.service';
import { EmployerRepository } from './employer.repository';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_pw'),
}));

jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('new-emp-id') }));

const mockEmployer = {
  id: 'emp-1',
  email: 'emp@company.com',
  passwordHash: 'secret',
  firstName: 'Alice',
  lastName: 'Smith',
  companyId: 'comp-1',
  isAdmin: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('EmployersService', () => {
  let service: EmployersService;
  let repo: {
    findById: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findByCompany: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      findByCompany: jest.fn(),
      create: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployersService,
        { provide: EmployerRepository, useValue: repo },
      ],
    }).compile();

    service = module.get<EmployersService>(EmployersService);
  });

  describe('getMe', () => {
    it('returns employer without passwordHash', async () => {
      repo.findById.mockResolvedValue(mockEmployer);

      const result = await service.getMe('emp-1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('emp@company.com');
    });

    it('throws NotFoundException when employer not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getMe('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMe', () => {
    it('updates and returns sanitized employer', async () => {
      repo.findById.mockResolvedValue({ ...mockEmployer, firstName: 'Bob' });

      const result = await service.updateMe('emp-1', { firstName: 'Bob' });

      expect(repo.update).toHaveBeenCalledWith(
        'emp-1',
        expect.objectContaining({ firstName: 'Bob', updatedAt: expect.any(String) }),
      );
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('deleteMe', () => {
    it('deletes the employer account', async () => {
      await service.deleteMe('emp-1');

      expect(repo.delete).toHaveBeenCalledWith('emp-1');
    });
  });

  describe('listByCompany', () => {
    it('returns all employers in the company without passwordHash', async () => {
      repo.findByCompany.mockResolvedValue([mockEmployer, { ...mockEmployer, id: 'emp-2', isAdmin: false }]);

      const result = await service.listByCompany('comp-1');

      expect(repo.findByCompany).toHaveBeenCalledWith('comp-1');
      expect(result).toHaveLength(2);
      result.forEach((emp) => expect(emp).not.toHaveProperty('passwordHash'));
    });
  });

  describe('addToCompany', () => {
    it('creates a non-admin employer for the company', async () => {
      repo.findById.mockResolvedValue({ ...mockEmployer, id: 'new-emp-id', isAdmin: false });

      const result = await service.addToCompany('comp-1', {
        email: 'new@company.com',
        password: 'pw',
        firstName: 'New',
        lastName: 'Employee',
      });

      expect(repo.create).toHaveBeenCalledWith(
        'new-emp-id',
        expect.objectContaining({ companyId: 'comp-1', isAdmin: false, passwordHash: 'hashed_pw' }),
      );
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('updateById', () => {
    it('updates employer in same company', async () => {
      repo.findById
        .mockResolvedValueOnce(mockEmployer)
        .mockResolvedValueOnce({ ...mockEmployer, firstName: 'Updated' });

      const result = await service.updateById('emp-1', 'comp-1', { firstName: 'Updated' });

      expect(repo.update).toHaveBeenCalledWith('emp-1', expect.objectContaining({ firstName: 'Updated' }));
      expect(result.firstName).toBe('Updated');
    });

    it('throws NotFoundException when employer does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.updateById('missing', 'comp-1', {})).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when employer is in a different company', async () => {
      repo.findById.mockResolvedValue({ ...mockEmployer, companyId: 'other-comp' });

      await expect(service.updateById('emp-1', 'comp-1', {})).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteById', () => {
    it('deletes employer from same company', async () => {
      repo.findById.mockResolvedValue(mockEmployer);

      await service.deleteById('emp-1', 'comp-1');

      expect(repo.delete).toHaveBeenCalledWith('emp-1');
    });

    it('throws NotFoundException when employer does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.deleteById('missing', 'comp-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when employer is in a different company', async () => {
      repo.findById.mockResolvedValue({ ...mockEmployer, companyId: 'other-comp' });

      await expect(service.deleteById('emp-1', 'comp-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
