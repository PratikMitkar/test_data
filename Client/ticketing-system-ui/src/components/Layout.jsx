import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import {
  Users,
  FolderOpen,
  Bell,
  LogOut,
  User,
  Shield,
  Crown,
  Building,
  Home as House,
  Inbox as Tray,
  BarChart as PresentationChart,
  Plus,
  ChevronRight,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Set expanded state based on localStorage or default to false
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarExpanded');
    if (savedState !== null) {
      setSidebarExpanded(savedState === 'true');
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarExpanded', sidebarExpanded);
  }, [sidebarExpanded]);

  const navigation = [
    { name: 'Home', href: '/dashboard', icon: House },
    { name: 'My Tickets', href: '/tickets', icon: Tray, exact: true },
    { name: 'Assigned to Me', href: '/tickets/assigned', icon: ArrowRight },
    { name: 'Projects', href: '/projects', icon: FolderOpen, roles: ['team', 'admin', 'super_admin'] },
    { name: 'Approval Tasks', href: '/tickets/approval', icon: PresentationChart, roles: ['team', 'admin', 'super_admin'] },
    { name: 'People', href: '/users', icon: Users, roles: ['admin', 'super_admin'] },
    { name: 'Teams', href: '/teams', icon: Building, roles: ['admin', 'super_admin'] },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true; // Show items without role restrictions
    return item.roles.includes(user?.role);
  });

  // Check if current page is a ticket detail page
  const isTicketDetailPage = location.pathname.match(/\/tickets\/\d+$/);

  // Function to check if a navigation item is active
  const isItemActive = (item) => {
    const currentPath = location.pathname;
    
    // For items marked as exact, only match the exact path
    if (item.exact) {
      return currentPath === item.href || currentPath === `${item.href}/`;
    }
    
    // For Reports specifically, only match the exact path or its children
    if (item.href === '/tickets/approval') {
      return currentPath === '/tickets/approval' || currentPath.startsWith('/tickets/approval/');
    }
    
    // For other items, match if the current path starts with the item's href
    // But make sure it's not a sub-path of another item
    // For example, /tickets/123 should match Inbox, but /tickets/approval should not
    if (item.href === '/tickets' && currentPath.startsWith('/tickets/')) {
      // Don't match /tickets/approval or /tickets/assigned for the Inbox item
      return !currentPath.startsWith('/tickets/approval') && 
             !currentPath.startsWith('/tickets/assigned') && 
             !currentPath.match(/\/tickets\/\d+\/edit$/);
    }
    
    return currentPath === item.href || currentPath.startsWith(`${item.href}/`);
  };

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'team':
        return <Building className="h-4 w-4 text-green-600" />;
      case 'user':
        return <User className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'team':
        return 'Team Manager';
      case 'user':
        return 'Member';
      default:
        return 'Unknown';
    }
  };

  const getUserDisplayName = () => {
    if (user?.role === 'team') {
      return user.teamName || user.managerName || 'Team Manager';
    }
    return user?.name || user?.username || 'User';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      {/* Sidebar - Fixed position with full height */}
      <div 
        className={`transition-all duration-300 ease-in-out border-r border-gray-200 h-screen ${
          sidebarExpanded ? 'w-64' : 'w-20'
        } flex-shrink-0 fixed top-0 left-0 z-10`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 
              className={`text-[#141414] text-base font-medium leading-normal transition-opacity duration-300 ${
                sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
              }`}
            >
              Acme Co
            </h1>
            <button 
              onClick={toggleSidebar} 
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarExpanded ? (
                <ChevronLeft className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
          
          <nav className="flex flex-col gap-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const active = isItemActive(item);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                    active ? 'bg-[#ededed]' : 'hover:bg-gray-100'
                  }`}
                  onMouseEnter={() => !sidebarExpanded && setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="text-[#141414] flex-shrink-0">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span 
                    className={`text-[#141414] text-sm font-medium leading-normal whitespace-nowrap transition-all duration-300 ${
                      sidebarExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 overflow-hidden'
                    }`}
                  >
                    {item.name}
                  </span>
                  
                  {/* Hover tooltip */}
                  {!sidebarExpanded && hoveredItem === item.name && (
                    <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Spacer to push content to bottom */}
          <div className="flex-grow"></div>
          
          {/* Bottom section with invite and user profile */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            {/* Invite team button */}
            <div 
              className="relative flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 cursor-pointer mb-4"
              onMouseEnter={() => !sidebarExpanded && setHoveredItem('invite')}
              onMouseLeave={() => setHoveredItem(null)}
            >


            </div>
            
            {/* User profile section */}
            <div className="flex flex-col gap-2">
              <div 
                className="relative flex items-center gap-3 px-3 py-2 rounded-xl"
                onMouseEnter={() => !sidebarExpanded && setHoveredItem('profile')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div 
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-8 w-8 flex-shrink-0"
                  style={{ backgroundImage: `url("https://i.pravatar.cc/300?u=${user?.id || '1'}")` }}
                ></div>
                
                {sidebarExpanded && (
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[#141414] text-sm font-medium leading-tight truncate">
                      {getUserDisplayName()}
                    </span>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(user?.role)}
                      <span className="text-neutral-500 text-xs">
                        {getRoleLabel(user?.role)}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Hover tooltip */}
                {!sidebarExpanded && hoveredItem === 'profile' && (
                  <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap z-50">
                    {getUserDisplayName()} ({getRoleLabel(user?.role)})
                  </div>
                )}
              </div>
              
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="relative flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 w-full text-left"
                onMouseEnter={() => !sidebarExpanded && setHoveredItem('logout')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="text-red-500 flex-shrink-0">
                  <LogOut className="h-5 w-5" />
                </div>
                <span 
                  className={`text-red-500 text-sm font-medium leading-normal whitespace-nowrap transition-all duration-300 ${
                    sidebarExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 overflow-hidden'
                  }`}
                >
                  Logout
                </span>
                
                {/* Hover tooltip */}
                {!sidebarExpanded && hoveredItem === 'logout' && (
                  <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap z-50">
                    Logout
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Add left margin to account for fixed sidebar */}
      <div className={`flex flex-col flex-1 overflow-hidden ${sidebarExpanded ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Header */}
        <Header />
        
        {/* Main Content with Scrolling */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header with Breadcrumb - Only show if not on ticket detail page */}
            {!isTicketDetailPage && (
              <div className="flex flex-wrap gap-2 p-4">
                <Link to="/dashboard" className="text-neutral-500 text-base font-medium leading-normal">
                  Projects
                </Link>
                <span className="text-neutral-500 text-base font-medium leading-normal">/</span>
                <span className="text-[#141414] text-base font-medium leading-normal">
                  {location.pathname.split('/').pop().charAt(0).toUpperCase() + location.pathname.split('/').pop().slice(1)}
                </span>
              </div>
            )}

            {/* Page Content */}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;