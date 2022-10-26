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
    it('should succeed if payload is null', async () => {
      jest.spyOn(service, 'getPodcast').mockResolvedValue({
        ok: true,
        podcast: expect.any(Podcast),
      });
      const result = await service.updatePodcast({
        ...trueUpdatePodcastArgs,
        payload: { rating: null },
      });
      expect(result).toEqual({
        ok: true,
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

  describe('getEpisodes', () => {
    const getEpisodesArg = {
      id: 1,
    };
    it('should fail with error', async () => {
      jest.spyOn(service, 'getPodcast').mockRejectedValue(new Error());
      const result = await service.getEpisodes(getEpisodesArg.id);
      expect(result).toEqual(InternalServerErrorOutput);
    });
    it('should fail when getPodcast fails', async () => {
      jest.spyOn(service, 'getPodcast').mockResolvedValue({
        podcast: null,
        ok: false,
        error: 'erred',
      });
      const result = await service.getEpisodes(getEpisodesArg.id);
      expect(result).toEqual({
        ok: false,
        error: 'erred',
      });
    });
    it('should succeed', async () => {
      const testPodcast = {
        podcast: expect.any(Podcast),
        ok: true,
        error: null,
      };
      jest.spyOn(service, 'getPodcast').mockResolvedValue(testPodcast);
      const result = await service.getEpisodes(getEpisodesArg.id);
      console.log(result.episodes);
      expect(result).toHaveProperty('ok', true);
      expect(result).toHaveProperty('episodes');
    });
  });
  describe('getEpisode', () => {
    const getEpisodeArg = {
      podcastId: 1,
      episodeId: 2,
    };
    it('should fail with error', async () => {
      jest.spyOn(service, 'getEpisodes').mockRejectedValue(new Error());
      const result = await service.getEpisode(getEpisodeArg);
      expect(result).toEqual(InternalServerErrorOutput);
    });
    it('should fail when getEpisodes fails', async () => {
      jest.spyOn(service, 'getEpisodes').mockResolvedValue({
        episodes: null,
        ok: false,
        error: 'erred',
      });
      const result = await service.getEpisode(getEpisodeArg);
      expect(result).toEqual({
        ok: false,
        error: 'erred',
      });
    });
    it('should succeed', async () => {
      const testEpisode: Episode = {
        id: 2,
        title: '',
        category: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        podcast: expect.any(Podcast),
      };
      const podcastId = 1;
      jest.spyOn(service, 'getEpisodes').mockResolvedValue({
        ok: true,
        error: null,
        episodes: [testEpisode],
      });
      const result = await service.getEpisode(getEpisodeArg);
      expect(result).toHaveProperty('ok', true);
      expect(result).toHaveProperty('episode');
    });
    it('should fail if not found', async () => {
      const testEpisode: Episode = {
        id: 5,
        title: '',
        category: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        podcast: expect.any(Podcast),
      };
      const podcastId = 1;
      jest.spyOn(service, 'getEpisodes').mockResolvedValue({
        ok: true,
        error: null,
        episodes: [testEpisode],
      });
      const result = await service.getEpisode(getEpisodeArg);
      expect(result).toEqual({
        ok: false,
        error: `Episode with id ${getEpisodeArg.episodeId} not found in podcast with id ${getEpisodeArg.podcastId}`,
      });
    });
  });
  describe('createEpisode', () => {
    const createEpisodeArg = {
      podcastId: 1,
      title: '',
      category: '',
    };
    it('should fail when getPodcast fails', async () => {
      jest.spyOn(service, 'getPodcast').mockResolvedValue({
        podcast: null,
        ok: false,
        error: 'erred',
      });
      const result = await service.createEpisode(createEpisodeArg);
      expect(result).toEqual({
        ok: false,
        error: 'erred',
      });
    });
    it('should fail with error', async () => {
      jest.spyOn(service, 'getPodcast').mockRejectedValue(new Error());
      const result = await service.createEpisode(createEpisodeArg);
      expect(result).toEqual(InternalServerErrorOutput);
    });
    it('should succeed', async () => {
      const testPodcast: Podcast = {
        id: 5,
        title: '',
        rating: 4,
        category: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        episodes: [],
      };
      jest.spyOn(service, 'getPodcast').mockResolvedValue({
        podcast: testPodcast,
        ok: true,
        error: null,
      });
      episodeRepository.create.mockReturnValue({
        title: createEpisodeArg.title,
        category: createEpisodeArg.category,
        podcast: null,
      });
      episodeRepository.save.mockResolvedValue({
        id: 1,
      });
      const result = await service.createEpisode(createEpisodeArg);
      expect(result).toEqual({
        ok: true,
        id: 1,
      });
    });
  });
  describe('deleteEpisode', () => {
    const testEpisode: Episode = {
      id: 5,
      title: '',
      category: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      podcast: expect.any(Podcast),
    };
    const deleteEpisodeArgs = {
      podcastId: 1,
      episodeId: 2,
    };
    it('should fail with error', async () => {
      jest.spyOn(service, 'getEpisode').mockRejectedValue(new Error());
      const result = await service.deleteEpisode(deleteEpisodeArgs);
      expect(result).toEqual(InternalServerErrorOutput);
    });
    it('should fail if getEpisode fails', async () => {
      jest.spyOn(service, 'getEpisode').mockResolvedValue({
        ok: false,
        error: 'erred',
        episode: null,
      });
      const result = await service.deleteEpisode(deleteEpisodeArgs);
      expect(result).toEqual({ ok: false, error: 'erred' });
    });
    it('should succeed', async () => {
      jest.spyOn(service, 'getEpisode').mockResolvedValue({
        ok: true,
        error: 'erred',
        episode: testEpisode,
      });
      const result = await service.deleteEpisode(deleteEpisodeArgs);
      expect(result).toEqual({ ok: true });
    });
  });
  describe('updateEpisode', () => {
    const testEpisode: Episode = {
      id: 5,
      title: '',
      category: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      podcast: expect.any(Podcast),
    };
    const updateEpisodeArgs = {
      podcastId: 1,
      episodeId: 2,
    };
    it('should fail with error', async () => {
      jest.spyOn(service, 'getEpisode').mockRejectedValue(new Error());
      const result = await service.updateEpisode(updateEpisodeArgs);
      expect(result).toEqual(InternalServerErrorOutput);
    });
    it('should fail if getEpisode fails', async () => {
      jest.spyOn(service, 'getEpisode').mockResolvedValue({
        ok: false,
        error: 'erred',
        episode: null,
      });
      const result = await service.updateEpisode(updateEpisodeArgs);
      expect(result).toEqual({ ok: false, error: 'erred' });
    });
    it('should succeed', async () => {
      jest.spyOn(service, 'getEpisode').mockResolvedValue({
        ok: true,
        error: 'erred',
        episode: testEpisode,
      });
      const result = await service.updateEpisode(updateEpisodeArgs);
      expect(result).toEqual({ ok: true });
    });
  });
});
