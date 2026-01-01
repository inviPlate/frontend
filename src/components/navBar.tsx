import { Link, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Button, Dropdown, DropdownItem } from "flowbite-react";
import IconPng from '../assets/Icon.png';
import { useOffertoryModal } from '../context/OffertoryModalContext';


interface NavItem {
    name: string;
    path: string;
    children?: NavItem[];
}

export function NavBar() {
    const location = useLocation();
    const { openModal } = useOffertoryModal();

    const navItems: NavItem[] = [
        { 
            name: 'Overview', 
            path: '/',
            children: [
                { name: 'Overview', path: '/' },
                { name: 'Treasurer Report', path: '/treasurer-report' }
            ]
        },
        { name: 'Transactions', path: '/transactions' },
        { 
            name: 'Budget', 
            path: '/budget',
            children: [
                { name: 'Effective Year', path: '/budget/year' },
                { name: 'Budget Heads', path: '/budget/heads' }
            ]
        },
        { name: 'Receipts', path: '/receipts' },
        { name: 'Funds', path: '/funds' },
        { name: 'Members', path: '/members' }
    ];

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <nav className="bg-white fixed w-full z-20 top-0 start-0  border-gray-200 dark:border-gray-600">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                {/* Logo */}
                <Link to="/" className="flex items-center">
                    <img src={IconPng} className="h-10" alt="InviPlate Logo" />
                    <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">InviPlate</span>
                </Link>

                {/* Navigation Items - Desktop */}
                <div className="hidden md:flex md:space-x-8">
                    {navItems.map((item) => {
                        if (item.children) {
                            // Render dropdown for items with children
                            return (
                                <Dropdown
                                inline
                                arrowIcon={false}
                                    key={item.name}
                                    label={
                                        <span className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                                            isActive(item.path)
                                                ? 'bg-red-500 text-white'
                                                : 'text-black-700 hover:text-gray-900 hover:bg-gray-100'
                                        }`}>
                                            {item.name}
                                        </span>
                                    }
                                >
                                    {item.children.map((child) => (
                                        <DropdownItem key={child.name}>
                                            <Link to={child.path} className="block w-full">
                                                {child.name}
                                            </Link>
                                        </DropdownItem>
                                    ))}
                                </Dropdown>
                            );
                        } else {
                            // Render regular link for items without children
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                                        isActive(item.path)
                                            ? 'bg-red-500 text-white'
                                            : 'text-black-700 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            );
                        }
                    })}
                </div>

                {/* Right side - Add Offertory, Notification, User Profile */}
                <div className="flex items-center space-x-3">
                    {/* Add Offertory Button - Opens Offertory Modal */}
                    <Button 
                        className="flex items-center space-x-1"
                        onClick={openModal}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        <span>Add Offertory</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </Button>

                    {/* User Profile */}
                    <div className="flex items-center space-x-2">
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-8 h-8"
                                }
                            }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">PH</span>
                    </div>

                    {/* Mobile menu button */}
                    <button 
                        type="button" 
                        className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                    >
                        <span className="sr-only">Open main menu</span>
                        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
    );
}