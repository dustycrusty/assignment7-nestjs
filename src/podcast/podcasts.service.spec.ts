import { Episode } from './entities/episode.entity';
import { Podcast } from './entities/podcast.entity';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PodcastsService } from './podcasts.service';

const InternalServerErrorOutput = {
  ok: false,
  error: 'Internal server error occurred.',
};

const MockRepository = () => {
  return {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findOneOrFail: jest.fn(),
    find: jest.fn(),
  };
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('PodcastService', () => {
  let podcastRepository: MockRepository<Podcast>;
  let episodeRepository: MockRepository<Episode>;
  let service: PodcastsService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PodcastsService,
        {
          provide: getRepositoryToken(Podcast),
          useValue: MockRepository(),
        },
        {
          provide: getRepositoryToken(Episode),
          useValue: MockRepository(),
        },
      ],
    }).compile();
    service = module.get<PodcastsService>(PodcastsService);
    podcastRepository = module.get(getRepositoryToken(Podcast));
    episodeRepository = module.get(getRepositoryToken(Episode));
  });

  it('toBeDefined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllPodcasts', () => {
    it('should fail with error', async () => {
      podcastRepository.find.mockRejectedValue(new Error());
      const result = await service.getAllPodcasts();
      expect(result).toEqual(InternalServerErrorOutput);
    });

    it('should succeed', async () => {
      const podcasts = [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ];
      podcastRepository.find.mockResolvedValue(podcasts);
      const result = await service.getAllPodcasts();
      expect(result).toEqual({
        ok: true,
        podcasts,
      });
    });
  });
  describe('createPodcast', () => {
    it('should fail with error', async () => {
      const podcastArgs = {
        title: 'TITLE',
        category: 'CATEGORY',
      };
      podcastRepository.create.mockReturnValue(podcastArgs);
      podcastRepository.save.mockRejectedValue(new Error());
      const result = await service.createPodcast(podcastArgs);
      expect(result).toEqual(InternalServerErrorOutput);
    });

    it('should succeed', async () => {
      const id = 1;
      const podcastArgs = {
        title: 'TITLE',
        category: 'CATEGORY',
        id,
      };

      podcastRepository.create.mockReturnValue(podcastArgs);
      podcastRepository.save.mockResolvedValue(podcastArgs);
      const result = await service.createPodcast(podcastArgs);
      expect(result).toEqual({
        ok: true,
        id,
      });
    });
  });
  describe('getPodcast', () => {
    it('should fail with error', async () => {
      const id = 1;
      podcastRepository.findOne.mockRejectedValue(new Error());
      const result = await service.getPodcast(id);
      expect(result).toEqual(InternalServerErrorOutput);
    });
    it('shoud fail when not found', async () => {
      const id = 1;
      podcastRepository.findOne.mockResolvedValue(null);
      const result = await service.getPodcast(id);
      expect(result).toEqual({
        ok: false,
        error: `Podcast with id ${id} not found`,
      });
    });
    it('should succeed', async () => {
      const id = 1;
      podcastRepository.findOne.mockResolvedValue({ id });
      const result = await service.getPodcast(id);
      expect(result).toEqual({
        ok: true,
        podcast: { id },
      });
    });
  });
  describe('deletePodcast', () => {
    it('should fail with error', async () => {
      const id = 1;
      jest.spyOn(service, 'getPodcast').mockRejectedValue(new Error());
      const result = await service.deletePodcast(id);
      expect(result).toEqual(InternalServerErrorOutput);
    });
    it('shoud fail when not found', async () => {
      const id = 1;
      jest.spyOn(service, 'getPodcast').mockResolvedValue({
        ok: false,
        error: 'ERRED',
      });
      const result = await service.deletePodcast(id);
      expect(result).toEqual({
        ok: false,
        error: 'ERRED',
      });
    });
    it('should succeed', async () => {
      const id = 1;
      jest.spyOn(service, 'getPodcast').mockResolvedValue({
        ok: true,
      });
      const result = await service.deletePodcast(id);
      expect(result).toEqual({
        ok: true,
      });
    });
  });
  describe('updatePodcast', () => {
    const trueUpdatePodcastArgs = {
      id: 1,
      payload: {
        rating: 4,
      },
    };
    const falseUpdatePodcastArgs = {
      id: 1,
      payload: {
        rating: 6,
      },
    };
    it('should fail with error', async () => {
      jest.spyOn(service, 'getPodcast').mockRejectedValue(new Error());
      const result = await service.updatePodcast(trueUpdatePodcastArgs);
      expect(result).toEqual(InternalServerErrorOutput);
    });
    it('shoud fail when not found', async () => {
      jest.spyOn(service, 'getPodcast').mockResolvedValue({
        ok: false,
        error: 'ERRED',
        podcast: null,
      });
      const result = await service.updatePodcast(trueUpdatePodcastArgs);
      expect(result).toEqual({
        ok: false,
        error: 'ERRED',
      });
    });
    it('should fail when rating is not in 1~5', async () => {
      jest.spyOn(service, 'getPodcast').mockResolvedValue({
        ok: true,
        podcast: expect.any(Podcast),
      });
      const result = await service.updatePodcast(falseUpdatePodcastArgs);
      expect(result).toEqual({
        ok: false,
        error: 'Rating must be between 1 and 5.',
      });
    });
    it('should succeed', async () => {
      const id = 1;
      jest.spyOn(service, 'getPodcast').mockResolvedValue({
        ok: true,
      });
      const result = await service.updatePodcast(trueUpdatePodcastArgs);
      expect(result).toEqual({
        ok: true,
      });
    });
  });

  it.todo('getEpisodes');
  it.todo('getEpisode');
  it.todo('createEpisode');
  it.todo('deleteEpisode');
  it.todo('updateEpisode');
});
