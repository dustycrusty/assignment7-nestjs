import { JwtService } from 'src/jwt/jwt.service';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';

const MockRepository = () => {
  return {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findOneOrFail: jest.fn(),
  };
};

const MockJwtService = {
  sign: jest.fn(() => 'test_token'),
  verify: jest.fn(),
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: MockRepository(),
        },

        {
          provide: JwtService,
          useValue: MockJwtService,
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('toBeDefined', () => {
    expect(service).toBeDefined();
  });
  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'test@email.com',
      password: 'test_password',
      role: UserRole.Host,
    };
    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });

    it('should create a new user', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);

      const result = await service.createAccount(createAccountArgs);

      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);

      expect(result).toEqual({ ok: true, error: null });
    });
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error('Find One Failed'));
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ ok: false, error: 'Could not create account' });
    });
  });
  describe('login', () => {
    const loginArgs = {
      email: 'bs@email.com',
      password: 'test_password',
    };

    it('should fail if user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.login(loginArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toEqual({ ok: false, error: 'User not found' });
    });

    it('should fail if wrong password', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: 'Wrong password',
      });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.login(loginArgs);
      expect(result).toHaveProperty('ok', false);
      expect(result).toHaveProperty('error');
    });

    it('should succeed with token return', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(mockedUser.id);
      expect(result).toEqual({
        ok: true,
        token: 'test_token',
      });
    });
  });
  describe('findById', () => {
    const id = 1;
    const mockedUser = {
      id,
    };
    it('should find a user', async () => {
      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);
      const result = await service.findById(id);
      expect(result).toEqual({
        ok: true,
        user: mockedUser,
      });
    });
    it('should fail when user does not exist', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(id);
      expect(result).toEqual({
        ok: false,
        error: 'User Not Found',
      });
    });
  });
  describe('editProfile', () => {
    it('should change email', async () => {
      const oldUser = {
        email: 'bs@email.com',
        verified: true,
      };
      const newUser = {
        email: 'bs@new.com',
        verified: false,
      };
      const editProfileArgs = {
        userId: 1,
        input: {
          email: 'bs@new.com',
        },
      };

      usersRepository.findOne.mockResolvedValue(oldUser);

      await service.editProfile(editProfileArgs.userId, editProfileArgs.input);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        editProfileArgs.userId,
      );
    });

    it('should change password and succeed', async () => {
      const oldUser = {
        email: 'bs@email.com',
        verified: true,
        password: 'oldpassword',
      };
      const editProfileArgs = {
        userId: 1,
        input: {
          password: 'newpassword',
        },
      };
      const newUser = {
        ...oldUser,
        password: editProfileArgs.input.password,
      };
      usersRepository.findOne.mockResolvedValue(oldUser);
      usersRepository.save.mockResolvedValue(newUser);

      const result = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(newUser);
      expect(result).toEqual({ ok: true });
    });
    it('should fail on exception', async () => {
      const editProfileArgs = {
        userId: 1,
        input: {
          password: 'newpassword',
        },
      };
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );
      expect(result).toEqual({
        error: 'Could not update profile',
        ok: false,
      });
    });
  });
});
