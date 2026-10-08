"use client";
import { Fragment } from "react";
import { PromoBanners } from "@/user/components/promo/PromoBanners";
import type { ComponentType } from "react";
import { useDb } from "@/shared/hooks/useDb";
import type { HomeSection, HomeSectionType } from "@/types";
import {
  CategoriesSection, CraftSection, EditorialSection, FeaturedCollectionSection, HeroSection, NewsletterSection,
  PersonalisationSection, ProductRailSection, ShowroomsSection, SocialSection, StorySection, TestimonialsSection, VideoStorySection,
} from "./sections";

/** Section registry — admin controls order, visibility and content (Admin › CMS › Homepage). */
export const SECTION_COMPONENTS: Record<HomeSectionType, ComponentType<{ s: HomeSection }>> = {
  hero: HeroSection,
  categories: CategoriesSection,
  featuredCollection: FeaturedCollectionSection,
  newArrivals: ProductRailSection,
  bestSellers: ProductRailSection,
  diamondStory: StorySection,
  goldStory: StorySection,
  editorial: EditorialSection,
  videoStory: VideoStorySection,
  personalisation: PersonalisationSection,
  showrooms: ShowroomsSection,
  craftsmanship: CraftSection,
  testimonials: TestimonialsSection,
  social: SocialSection,
  newsletter: NewsletterSection,
};

export function HomeSections() {
  const d = useDb();
  return (
    <>
      {d.cms.sections.filter((s) => s.enabled).map((s) => {
        const C = SECTION_COMPONENTS[s.type];
        if (!C) return null;
        // Promotional banners (Admin › Banners, placement "home") appear after Best Sellers.
        return s.type === "bestSellers" ? (
          <Fragment key={s.id}>
            <C s={s} />
            <div className="container promo-section"><PromoBanners placement="home" /></div>
          </Fragment>
        ) : (
          <C key={s.id} s={s} />
        );
      })}
    </>
  );
}
