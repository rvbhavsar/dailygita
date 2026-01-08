import { Link } from 'react-router-dom';
import { Clock, BookOpen, ChevronRight, Compass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VerseWithInsights } from '@/types';

interface HomeSidebarProps {
  tomorrowsVerse: VerseWithInsights;
  timeLeft: { hours: number; minutes: number };
}

// All 18 chapters of the Bhagavad Gita
const chapters = [
  { number: 1, name: 'Arjuna Vishada Yoga', verses: 47 },
  { number: 2, name: 'Sankhya Yoga', verses: 72 },
  { number: 3, name: 'Karma Yoga', verses: 43 },
  { number: 4, name: 'Jnana Karma Sanyasa Yoga', verses: 42 },
  { number: 5, name: 'Karma Sanyasa Yoga', verses: 29 },
  { number: 6, name: 'Dhyana Yoga', verses: 47 },
  { number: 7, name: 'Jnana Vijnana Yoga', verses: 30 },
  { number: 8, name: 'Aksara Brahma Yoga', verses: 28 },
  { number: 9, name: 'Raja Vidya Raja Guhya Yoga', verses: 34 },
  { number: 10, name: 'Vibhuti Yoga', verses: 42 },
  { number: 11, name: 'Vishvarupa Darshana Yoga', verses: 55 },
  { number: 12, name: 'Bhakti Yoga', verses: 20 },
  { number: 13, name: 'Ksetra Ksetrajna Vibhaga Yoga', verses: 35 },
  { number: 14, name: 'Gunatraya Vibhaga Yoga', verses: 27 },
  { number: 15, name: 'Purusottama Yoga', verses: 20 },
  { number: 16, name: 'Daivasura Sampad Vibhaga Yoga', verses: 24 },
  { number: 17, name: 'Sraddhatraya Vibhaga Yoga', verses: 28 },
  { number: 18, name: 'Moksha Sanyasa Yoga', verses: 78 },
];

const HomeSidebar = ({ tomorrowsVerse, timeLeft }: HomeSidebarProps) => {
  return (
    <aside className="space-y-6">
      {/* Tomorrow's Verse Preview */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Next Verse</CardTitle>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeLeft.hours}h {timeLeft.minutes}m</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Link to={`/verse/${tomorrowsVerse.id}`} className="group block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Chapter {tomorrowsVerse.chapter} • Verse {tomorrowsVerse.verse}
            </span>
            <p className="text-foreground mt-2 line-clamp-3 text-sm italic">
              "{tomorrowsVerse.english}"
            </p>
            <div className="flex items-center gap-1 text-primary text-xs mt-3 group-hover:underline">
              <span>Read ahead</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-medium">Quick Links</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <Link to="/browse">
            <Button variant="ghost" className="w-full justify-start h-9 text-sm">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse All Verses
            </Button>
          </Link>
          <Link to="/challenges">
            <Button variant="ghost" className="w-full justify-start h-9 text-sm">
              <Compass className="h-4 w-4 mr-2" />
              Life Challenges
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Chapters Shortcut */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-medium">Chapters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-1.5">
            {chapters.map((chapter) => (
              <Link
                key={chapter.number}
                to={`/browse?chapter=${chapter.number}`}
                className="group"
              >
                <div className="flex flex-col items-center justify-center p-2 rounded-md bg-secondary/30 hover:bg-secondary/60 transition-colors text-center">
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {chapter.number}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <Link to="/browse" className="block mt-3">
            <Button variant="outline" size="sm" className="w-full text-xs">
              View All Chapters
            </Button>
          </Link>
        </CardContent>
      </Card>
    </aside>
  );
};

export default HomeSidebar;
