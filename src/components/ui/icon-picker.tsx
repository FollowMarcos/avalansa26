'use client';

import { useState, useMemo, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import * as FaIcons from 'react-icons/fa6';
import * as SiIcons from 'react-icons/si';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { IconDisplay } from './icon-display';
import { Search, ChevronDown } from 'lucide-react';

type IconLibrary = 'lucide' | 'fa' | 'si';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Get all Lucide icon names (filter out non-icon exports)
const lucideIconNames = Object.keys(LucideIcons).filter(
  (key) =>
    key !== 'default' &&
    key !== 'createLucideIcon' &&
    key !== 'icons' &&
    !key.startsWith('Lucide') &&
    typeof (LucideIcons as Record<string, unknown>)[key] === 'function' &&
    /^[A-Z]/.test(key)
);

// Get FontAwesome icon names
const faIconNames = Object.keys(FaIcons).filter(
  (key) => key.startsWith('Fa') && typeof (FaIcons as Record<string, unknown>)[key] === 'function'
);

// Get Simple Icons names
const siIconNames = Object.keys(SiIcons).filter(
  (key) => key.startsWith('Si') && typeof (SiIcons as Record<string, unknown>)[key] === 'function'
);

// Popular/common icons to show first
const popularLucideIcons = [
  'Home', 'User', 'Settings', 'Search', 'Menu', 'X', 'Plus', 'Minus',
  'Check', 'ChevronRight', 'ChevronDown', 'ChevronUp', 'ChevronLeft',
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ExternalLink',
  'Mail', 'Phone', 'MapPin', 'Calendar', 'Clock', 'Bell', 'Heart',
  'Star', 'Bookmark', 'Share', 'Download', 'Upload', 'File', 'Folder',
  'Image', 'Camera', 'Video', 'Music', 'Play', 'Pause', 'SkipForward',
  'Volume2', 'Mic', 'Edit', 'Trash2', 'Copy', 'Clipboard', 'Link',
  'Globe', 'Lock', 'Unlock', 'Eye', 'EyeOff', 'Shield', 'Key',
  'CreditCard', 'ShoppingCart', 'Package', 'Truck', 'Gift', 'Tag',
  'Users', 'UserPlus', 'UserCheck', 'MessageCircle', 'MessageSquare',
  'Send', 'Inbox', 'Archive', 'Filter', 'SortAsc', 'SortDesc',
  'LayoutDashboard', 'LayoutGrid', 'List', 'Table', 'Columns',
  'Code', 'Terminal', 'Database', 'Server', 'Cloud', 'Wifi',
  'Smartphone', 'Laptop', 'Monitor', 'Printer', 'Cpu', 'HardDrive',
  'Zap', 'Flame', 'Sun', 'Moon', 'CloudRain', 'Snowflake',
  'Sparkles', 'Wand2', 'Palette', 'Paintbrush', 'Pencil', 'Pen',
  'BookOpen', 'Library', 'GraduationCap', 'Trophy', 'Award', 'Medal',
  'Target', 'Flag', 'Compass', 'Navigation', 'Map', 'Route',
  'Activity', 'BarChart', 'PieChart', 'TrendingUp', 'TrendingDown',
  'Percent', 'DollarSign', 'Euro', 'Bitcoin', 'Wallet', 'Receipt',
  'Building', 'Building2', 'Store', 'Factory', 'Warehouse', 'Landmark',
  'Car', 'Bus', 'Train', 'Plane', 'Ship', 'Bike', 'Rocket',
  'Coffee', 'UtensilsCrossed', 'Wine', 'Pizza', 'Apple', 'Cake',
  'Dumbbell', 'HeartPulse', 'Pill', 'Stethoscope', 'Syringe',
  'Dog', 'Cat', 'Bird', 'Fish', 'Bug', 'Leaf', 'Flower', 'Tree',
];

const popularFaIcons = [
  'FaHouse', 'FaUser', 'FaGear', 'FaMagnifyingGlass', 'FaBars', 'FaXmark',
  'FaPlus', 'FaMinus', 'FaCheck', 'FaChevronRight', 'FaChevronDown',
  'FaArrowRight', 'FaArrowLeft', 'FaEnvelope', 'FaPhone', 'FaLocationDot',
  'FaCalendar', 'FaClock', 'FaBell', 'FaHeart', 'FaStar', 'FaBookmark',
  'FaShareNodes', 'FaDownload', 'FaUpload', 'FaFile', 'FaFolder', 'FaImage',
  'FaCamera', 'FaVideo', 'FaMusic', 'FaPlay', 'FaPause', 'FaVolumeHigh',
  'FaMicrophone', 'FaPen', 'FaTrash', 'FaCopy', 'FaLink', 'FaGlobe',
  'FaLock', 'FaUnlock', 'FaEye', 'FaEyeSlash', 'FaShield', 'FaKey',
  'FaCreditCard', 'FaCartShopping', 'FaBox', 'FaTruck', 'FaGift', 'FaTag',
  'FaUsers', 'FaUserPlus', 'FaComment', 'FaComments', 'FaPaperPlane',
  'FaInbox', 'FaFilter', 'FaSort', 'FaTableColumns', 'FaList', 'FaGrip',
  'FaCode', 'FaTerminal', 'FaDatabase', 'FaServer', 'FaCloud', 'FaWifi',
  'FaMobile', 'FaLaptop', 'FaDesktop', 'FaPrint', 'FaMicrochip',
  'FaBolt', 'FaFire', 'FaSun', 'FaMoon', 'FaCloudRain', 'FaSnowflake',
  'FaWandMagicSparkles', 'FaPalette', 'FaPaintbrush', 'FaPencil',
  'FaBook', 'FaGraduationCap', 'FaTrophy', 'FaAward', 'FaMedal',
  'FaBullseye', 'FaFlag', 'FaCompass', 'FaMap', 'FaRoute',
  'FaChartLine', 'FaChartPie', 'FaArrowTrendUp', 'FaPercent', 'FaDollarSign',
  'FaBuilding', 'FaStore', 'FaIndustry', 'FaWarehouse', 'FaLandmark',
  'FaCar', 'FaBus', 'FaTrain', 'FaPlane', 'FaShip', 'FaBicycle', 'FaRocket',
  'FaMugHot', 'FaUtensils', 'FaWineGlass', 'FaPizzaSlice', 'FaAppleWhole',
  'FaDumbbell', 'FaHeartPulse', 'FaPills', 'FaStethoscope', 'FaSyringe',
  'FaDog', 'FaCat', 'FaFish', 'FaBug', 'FaLeaf', 'FaSeedling', 'FaTree',
  'FaGithub', 'FaTwitter', 'FaFacebook', 'FaInstagram', 'FaLinkedin',
  'FaYoutube', 'FaTiktok', 'FaDiscord', 'FaSlack', 'FaTelegram',
  'FaSpotify', 'FaApple', 'FaGoogle', 'FaMicrosoft', 'FaAmazon',
];

const popularSiIcons = [
  'SiGithub', 'SiTwitter', 'SiFacebook', 'SiInstagram', 'SiLinkedin',
  'SiYoutube', 'SiTiktok', 'SiDiscord', 'SiSlack', 'SiTelegram',
  'SiSpotify', 'SiApple', 'SiGoogle', 'SiMicrosoft', 'SiAmazon',
  'SiNetflix', 'SiTwitch', 'SiReddit', 'SiPinterest', 'SiSnapchat',
  'SiWhatsapp', 'SiMessenger', 'SiSkype', 'SiZoom', 'SiGooglemeet',
  'SiNotion', 'SiFigma', 'SiCanva', 'SiAdobephotoshop', 'SiAdobeillustrator',
  'SiReact', 'SiNextdotjs', 'SiVuedotjs', 'SiAngular', 'SiSvelte',
  'SiTypescript', 'SiJavascript', 'SiPython', 'SiRust', 'SiGo',
  'SiNodedotjs', 'SiDeno', 'SiBun', 'SiDocker', 'SiKubernetes',
  'SiVercel', 'SiNetlify', 'SiHeroku', 'SiDigitalocean', 'SiCloudflare',
  'SiSupabase', 'SiFirebase', 'SiMongodb', 'SiPostgresql', 'SiMysql',
  'SiTailwindcss', 'SiBootstrap', 'SiSass', 'SiCss3', 'SiHtml5',
  'SiGit', 'SiGitlab', 'SiBitbucket', 'SiJira', 'SiConfluence',
  'SiVscode', 'SiSublimetext', 'SiAtom', 'SiVim', 'SiNeovim',
  'SiLinux', 'SiUbuntu', 'SiDebian', 'SiFedora', 'SiArchlinux',
  'SiWindows', 'SiMacos', 'SiAndroid', 'SiIos', 'SiChrome',
  'SiFirefox', 'SiSafari', 'SiEdge', 'SiOpera', 'SiBrave',
  'SiNpm', 'SiYarn', 'SiPnpm', 'SiWebpack', 'SiVite',
  'SiStripe', 'SiPaypal', 'SiShopify', 'SiSquarespace', 'SiWordpress',
  'SiMedium', 'SiHashnode', 'SiDevdotto', 'SiStackoverflow', 'SiCodepen',
  'SiDribbble', 'SiBehance', 'SiUnsplash', 'SiPexels', 'SiGiphy',
  'SiOpenai', 'SiHuggingface', 'SiTensorflow', 'SiPytorch', 'SiKaggle',
];

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [library, setLibrary] = useState<IconLibrary>(() => {
    if (value?.startsWith('fa:')) return 'fa';
    if (value?.startsWith('si:')) return 'si';
    return 'lucide';
  });

  // Get the display name (without prefix)
  const getDisplayName = useCallback((iconValue: string) => {
    return iconValue?.replace(/^(hugeicons:|fa:|si:)/, '') || '';
  }, []);

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    const query = search.toLowerCase().trim();

    let icons: string[];
    let popular: string[];

    switch (library) {
      case 'fa':
        icons = faIconNames;
        popular = popularFaIcons;
        break;
      case 'si':
        icons = siIconNames;
        popular = popularSiIcons;
        break;
      default:
        icons = lucideIconNames;
        popular = popularLucideIcons;
    }

    if (!query) {
      // Show popular icons first, then others
      const popularSet = new Set(popular);
      const others = icons.filter(icon => !popularSet.has(icon));
      return [...popular.filter(p => icons.includes(p)), ...others].slice(0, 200);
    }

    return icons
      .filter((icon) => icon.toLowerCase().includes(query))
      .slice(0, 100);
  }, [search, library]);

  const handleSelect = (iconName: string) => {
    let fullValue = iconName;
    if (library === 'fa') fullValue = `fa:${iconName}`;
    else if (library === 'si') fullValue = `si:${iconName}`;

    onChange(fullValue);
    setOpen(false);
    setSearch('');
  };

  const renderIcon = (iconName: string) => {
    let fullName = iconName;
    if (library === 'fa') fullName = `fa:${iconName}`;
    else if (library === 'si') fullName = `si:${iconName}`;

    return <IconDisplay name={fullName} className="w-5 h-5" />;
  };

  const currentIconName = getDisplayName(value);
  const isCurrentLibrary =
    (library === 'lucide' && !value?.includes(':')) ||
    (library === 'fa' && value?.startsWith('fa:')) ||
    (library === 'si' && value?.startsWith('si:'));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between gap-2 h-10', className)}
        >
          <div className="flex items-center gap-2">
            <IconDisplay name={value} className="w-5 h-5" />
            <span className="truncate max-w-[120px] text-sm">
              {currentIconName || 'Select icon...'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <div className="p-3 border-b space-y-3">
          {/* Library tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {[
              { id: 'lucide' as const, label: 'Lucide', count: lucideIconNames.length },
              { id: 'fa' as const, label: 'FontAwesome', count: faIconNames.length },
              { id: 'si' as const, label: 'Brands', count: siIconNames.length },
            ].map((lib) => (
              <button
                key={lib.id}
                onClick={() => {
                  setLibrary(lib.id);
                  setSearch('');
                }}
                className={cn(
                  'flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors',
                  library === lib.id
                    ? 'bg-background shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {lib.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${filteredIcons.length} icons...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Icon grid */}
        <ScrollArea className="h-[280px]">
          <div className="p-2">
            {filteredIcons.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No icons found for "{search}"
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {filteredIcons.map((iconName) => {
                  const isSelected = isCurrentLibrary && currentIconName === iconName;
                  return (
                    <button
                      key={iconName}
                      onClick={() => handleSelect(iconName)}
                      title={iconName}
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                        'hover:bg-muted hover:scale-110',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                        isSelected && 'bg-primary/10 ring-2 ring-primary text-primary'
                      )}
                    >
                      {renderIcon(iconName)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with selected info */}
        {value && (
          <div className="p-2 border-t bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Selected:</span>
              <code className="px-1.5 py-0.5 bg-muted rounded font-mono">
                {value}
              </code>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
