'use client';

import { useState, useEffect } from 'react';
import { Plus, Shirt, Star, Briefcase as Suitcase, TrendingUp, Calendar, MapPin, Package, ArrowRight, Sparkles, CheckCircle, Lightbulb, Target, Smartphone, Camera, FolderOpen, Users, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store/useStore';
import { format } from 'date-fns';

export const HomePage = () => {
  const { 
    wardrobeItems, 
    trips, 
    setActiveTab, 
    currentTrip,
    setCurrentTrip 
  } = useStore();

  // State for collapsible How-To section
  const [isHowToExpanded, setIsHowToExpanded] = useState(true);

  // Calculate statistics
  const stats = {
    totalItems: wardrobeItems.length,
    essentialItems: wardrobeItems.filter(item => item.essential).length,
    totalTrips: trips.length,
    activeTrips: trips.filter(trip => 
      new Date(trip.endDate) >= new Date() && !trip.isTemplate
    ).length,
    templates: trips.filter(trip => trip.isTemplate).length
  };

  // Get recent/upcoming trips
  const upcomingTrips = trips
    .filter(trip => new Date(trip.startDate) >= new Date() && !trip.isTemplate)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  const recentTrips = trips
    .filter(trip => new Date(trip.endDate) < new Date() && !trip.isTemplate)
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    .slice(0, 2);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-item':
        setActiveTab('wardrobe');
        break;
      case 'plan-trip':
        setActiveTab('trips');
        break;
      case 'view-wardrobe':
        setActiveTab('wardrobe');
        break;
      case 'view-essentials':
        setActiveTab('wardrobe');
        break;
      default:
        break;
    }
  };

  const handleTripSelect = (trip: any) => {
    setCurrentTrip(trip);
    setActiveTab('packing');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Hero Section */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-0">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=1200')] bg-cover bg-center opacity-10" />
        <CardContent className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome to PackMate
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300 max-w-sm">
                Your smart travel companion for organized packing and effortless wardrobe management
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleQuickAction('add-item')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleQuickAction('plan-trip')}
                >
                  <Suitcase className="w-4 h-4 mr-1" />
                  Plan Trip
                </Button>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <Shirt className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How-To & Features Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <CardTitle className="text-lg">How PackMate Works</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHowToExpanded(!isHowToExpanded)}
              className="h-8 w-8 p-0 flex items-center justify-center"
            >
              {isHowToExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {isHowToExpanded && (
          <CardContent className="space-y-6">
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold break-words">1. Catalog Your Wardrobe</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-14">
                  Take photos of your clothes and accessories, add details like brand, color, and occasion. Build a complete digital wardrobe.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Suitcase className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold break-words">2. Plan Your Trips</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-14">
                  Create trips with destinations, dates, and activities. PackMate suggests items based on weather, occasion, and duration.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold break-words">3. Smart Packing</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-14">
                  Get intelligent packing suggestions, create virtual bags, and track what you've packed vs. what you need.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-semibold break-words">4. Track & Return</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-14">
                  Mark items as packed, track usage during your trip, and easily return items to your wardrobe when you get back.
                </p>
              </div>
            </div>

            {/* Key Benefits */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                Why Choose PackMate?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Never Forget Essentials</p>
                    <p className="text-xs text-muted-foreground">Smart suggestions ensure you pack everything you need</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Save Time Packing</p>
                    <p className="text-xs text-muted-foreground">Pre-planned outfits and organized packing lists</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Works Offline</p>
                    <p className="text-xs text-muted-foreground">PWA technology works without internet connection</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Trip Templates</p>
                    <p className="text-xs text-muted-foreground">Save common trip types for quick packing</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Start Guide */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                Quick Start Guide
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">1</span>
                  <span>Add items to your wardrobe with photos and details</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">2</span>
                  <span>Create your first trip with destination and dates</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">3</span>
                  <span>Use smart suggestions to pack your virtual bags</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">4</span>
                  <span>Track and return items when you get back home</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Items</p>

              </div>
              <p className="text-3xl font-bold">{stats.totalItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Essentials</p>

              </div>
              <p className="text-3xl font-bold">{stats.essentialItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Active Trips</p>

              </div>
              <p className="text-3xl font-bold">{stats.activeTrips}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Templates</p>

              </div>
              <div>
              <p className="text-3xl font-bold">{stats.templates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center gap-3 hover:shadow-md transition-shadow"
              onClick={() => handleQuickAction('add-item')}
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium">Add New Item</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center gap-3 hover:shadow-md transition-shadow"
              onClick={() => handleQuickAction('plan-trip')}
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Suitcase className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium">Plan Trip</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center gap-3 hover:shadow-md transition-shadow"
              onClick={() => handleQuickAction('view-wardrobe')}
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Shirt className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium">View Wardrobe</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-6 flex flex-col items-center gap-3 hover:shadow-md transition-shadow"
              onClick={() => handleQuickAction('view-essentials')}
            >
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-sm font-medium">Essentials</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Trips */}
      {upcomingTrips.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Upcoming Trips</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setActiveTab('trips')}
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingTrips.map((trip) => (
              <div 
                key={trip.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleTripSelect(trip)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{trip.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{format(new Date(trip.startDate), 'MMM dd')}</span>
                      {trip.destination && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{trip.destination}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{trip.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity or Getting Started */}
      {stats.totalItems === 0 ? (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800">
          <CardContent className="p-6 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold mb-2">Get Started with PackMate</h3>
            <p className="text-muted-foreground mb-4">
              Begin by adding items to your wardrobe, then create your first trip to experience smart packing
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => handleQuickAction('add-item')}>
                <Plus className="w-4 h-4 mr-1" />
                Add First Item
              </Button>
              <Button variant="outline" onClick={() => handleQuickAction('plan-trip')}>
                <Suitcase className="w-4 h-4 mr-1" />
                Plan First Trip
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : recentTrips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Trips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTrips.map((trip) => (
              <div 
                key={trip.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Suitcase className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{trip.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{format(new Date(trip.endDate), 'MMM dd, yyyy')}</span>
                      {trip.destination && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{trip.destination}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">Completed</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};