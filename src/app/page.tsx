"use client";
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// Add type for researcher
type Researcher = { cwid: string; surname: string; givenName: string };

// Add type for publication
type Publication = {
  pmid: number;
  authorPosition: string | null;
  articleTitle: string;
  articleYear: number;
  publicationTypeCanonical: string;
  doi: string;
  significanceScore: number;
  abstractVarchar: string | null;
};

// Add type for grant
type Grant = {
  [key: string]: any; // Using any for now since we don't know the exact structure
};

// Add type for clinical specialty
type ClinicalSpecialty = {
  cwid: string;
  personMesh: string;
  scoreBestMatch: number;
};

// Add type for clinical trial
type ClinicalTrial = {
  cwid: string;
  title: string;
  protocolType: string;
  nctNumber: string;
  overallCurrentStatus: string;
  phases: string;
  briefSummary: string | null;
};

export default function Home() {
  // State for form fields
  const [facultyId, setFacultyId] = useState("");
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [suggestions, setSuggestions] = useState<Researcher[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [grantsData, setGrantsData] = useState<Grant[]>([]);
  const [clinicalSpecialties, setClinicalSpecialties] = useState<ClinicalSpecialty[]>([]);
  const [clinicalTrials, setClinicalTrials] = useState<ClinicalTrial[]>([]);
  const [abstracts, setAbstracts] = useState(true);
  const [includeTrialSummaries, setIncludeTrialSummaries] = useState(true);

  const [voice, setVoice] = useState("Third person");
  const [length, setLength] = useState("Medium");
  const [timeframe, setTimeframe] = useState("Past 5 years");
  const [directive, setDirective] = useState("");
  const [audience, setAudience] = useState("General public");
  const [selectedKeyElements, setSelectedKeyElements] = useState<string[]>([
    'Research problems/questions',
    'Research goals',
    'Research methods'
  ]);

  const [summary, setSummary] = useState("");
  const [summaryTimestamp, setSummaryTimestamp] = useState("");
  const [history, setHistory] = useState<Array<{
    date: string;
    output: string;
    controls: string;
  }>>([]);
  const [clarity, setClarity] = useState(3);
  const [accuracy, setAccuracy] = useState(3);
  const [relevance, setRelevance] = useState(3);
  const [summaryTone, setSummaryTone] = useState("Formal");
  const [tone, setTone] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPubs, setSelectedPubs] = useState<Set<number>>(new Set());
  const [selectedGrants, setSelectedGrants] = useState<Set<string>>(new Set());
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(new Set());
  const [selectedTrials, setSelectedTrials] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'publications' | 'grants' | 'clinical-trials' | 'clinical-specialties'>('publications');
  const pageSize = 5;
  const grantsPageSize = 7;
  const specialtiesPageSize = 10;
  const trialsPageSize = 8;

  // Debounced fetch for researcher suggestions
  useEffect(() => {
    if (!facultyId || selectedResearcher?.cwid === facultyId) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-researchers?query=${encodeURIComponent(facultyId)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (e) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [facultyId, selectedResearcher]);

  // Hide dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !(dropdownRef.current as any).contains(e.target) &&
        inputRef.current &&
        !(inputRef.current as any).contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    }
    if (showSuggestions) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showSuggestions]);

  // Fetch publications when researcher is selected
  useEffect(() => {
    if (selectedResearcher) {
      fetch(`/api/publications?personIdentifier=${encodeURIComponent(selectedResearcher.cwid)}`)
        .then(res => res.json())
        .then(data => {
          // Ensure data is an array
          if (Array.isArray(data)) {
            setPublications(data);
          } else {
            console.error('Publications API returned non-array:', data);
            setPublications([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching publications:', error);
          setPublications([]);
        });
    } else {
      setPublications([]);
    }
  }, [selectedResearcher]);

  // Fetch grants when researcher is selected
  useEffect(() => {
    if (selectedResearcher) {
      fetch(`/api/grants?cwid=${encodeURIComponent(selectedResearcher.cwid)}`)
        .then(res => res.json())
        .then(data => {
          // Ensure data is an array
          if (Array.isArray(data)) {
            setGrantsData(data);
          } else {
            console.error('Grants API returned non-array:', data);
            setGrantsData([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching grants:', error);
          setGrantsData([]);
        });
    } else {
      setGrantsData([]);
    }
  }, [selectedResearcher]);

  // Fetch clinical specialties when researcher is selected
  useEffect(() => {
    if (selectedResearcher) {
      fetch(`/api/clinical-specialties?cwid=${encodeURIComponent(selectedResearcher.cwid)}`)
        .then(res => res.json())
        .then(data => {
          // Ensure data is an array
          if (Array.isArray(data)) {
            setClinicalSpecialties(data);
          } else {
            console.error('Clinical specialties API returned non-array:', data);
            setClinicalSpecialties([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching clinical specialties:', error);
          setClinicalSpecialties([]);
        });
    } else {
      setClinicalSpecialties([]);
    }
  }, [selectedResearcher]);

  // Fetch clinical trials when researcher is selected
  useEffect(() => {
    if (selectedResearcher) {
      fetch(`/api/clinical-trials?cwid=${encodeURIComponent(selectedResearcher.cwid)}`)
        .then(res => res.json())
        .then(data => {
          // Ensure data is an array
          if (Array.isArray(data)) {
            setClinicalTrials(data);
          } else {
            console.error('Clinical trials API returned non-array:', data);
            setClinicalTrials([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching clinical trials:', error);
          setClinicalTrials([]);
        });
    } else {
      setClinicalTrials([]);
    }
  }, [selectedResearcher]);

  useEffect(() => {
    setCurrentPage(0); // Reset to first page when publications change
  }, [publications]);

  useEffect(() => {
    setCurrentPage(0); // Reset to first page when grants change
  }, [grantsData]);

  useEffect(() => {
    setCurrentPage(0); // Reset to first page when clinical specialties change
  }, [clinicalSpecialties]);

  useEffect(() => {
    setCurrentPage(0); // Reset to first page when clinical trials change
  }, [clinicalTrials]);

  // Publication pagination logic - ensure publications is always an array
  const publicationsArray = Array.isArray(publications) ? publications : [];
  const paginatedPubs = publicationsArray.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(publicationsArray.length / pageSize);

  // Grants pagination logic - ensure grants is always an array
  const grantsArray = Array.isArray(grantsData) ? grantsData : [];
  const paginatedGrants = grantsArray.slice(currentPage * grantsPageSize, (currentPage + 1) * grantsPageSize);
  const totalGrantsPages = Math.ceil(grantsArray.length / grantsPageSize);

  // Clinical specialties pagination logic - ensure specialties is always an array
  const specialtiesArray = Array.isArray(clinicalSpecialties) ? clinicalSpecialties : [];
  const paginatedSpecialties = specialtiesArray.slice(currentPage * specialtiesPageSize, (currentPage + 1) * specialtiesPageSize);
  const totalSpecialtiesPages = Math.ceil(specialtiesArray.length / specialtiesPageSize);

  // Clinical trials pagination logic - ensure trials is always an array
  const trialsArray = Array.isArray(clinicalTrials) ? clinicalTrials : [];
  const paginatedTrials = trialsArray.slice(currentPage * trialsPageSize, (currentPage + 1) * trialsPageSize);
  const totalTrialsPages = Math.ceil(trialsArray.length / trialsPageSize);

  // Generate or regenerate summary
  const handleGenerateSummary = async () => {
    if (!selectedResearcher || selectedPubs.size === 0) {
      alert('Please select a researcher and at least one publication.');
      return;
    }

    // Check if "Grants received" is selected but no grants are chosen
    if (selectedKeyElements.includes('Grants received') && selectedGrants.size === 0) {
      alert('Please select at least one grant when "Grants received" is highlighted.');
      return;
    }

    // Check if "Clinical application" is selected but no clinical data is chosen
    if (selectedKeyElements.includes('Clinical application') && selectedSpecialties.size === 0 && selectedTrials.size === 0) {
      alert('Please select at least one clinical specialty or clinical trial when "Clinical application" is highlighted.');
      return;
    }

    setIsGenerating(true);

    try {
      const selectedPublications = publications.filter(pub => selectedPubs.has(pub.pmid));
      const selectedGrantsData = grantsData.filter(grant => {
        const grantId = grant.id || grant.grant_id || JSON.stringify(grant);
        return selectedGrants.has(grantId);
      });
      const selectedSpecialtiesData = clinicalSpecialties.filter(specialty => 
        selectedSpecialties.has(specialty.personMesh)
      );
      const selectedTrialsData = clinicalTrials.filter(trial => 
        selectedTrials.has(trial.nctNumber)
      );
      
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedPublications,
          selectedGrants: selectedGrantsData,
          selectedSpecialties: selectedSpecialtiesData,
          selectedTrials: selectedTrialsData,
          researcherName: `${selectedResearcher.givenName} ${selectedResearcher.surname}`,
          cwid: selectedResearcher.cwid,
          length,
          timeframe,
          voice,
          tone: summaryTone,
          audience,
          keyElements: selectedKeyElements,
          additionalInstructions: directive,
          includeAbstracts: abstracts,
          includeTrialSummaries: includeTrialSummaries
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newSummary = data.summary;
        setSummary(newSummary);
        
        // Update timestamp
        const now = new Date();
        const timestamp = now.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        setSummaryTimestamp(timestamp);
        
        // Add to history
        const controls = `Voice: ${voice}\nTone: ${summaryTone}\nData used: ${selectedPubs.size} publications`;
        const historyEntry = {
          date: now.toISOString().split('T')[0], // YYYY-MM-DD format
          output: newSummary, // Store the full summary
          controls
        };
        setHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to generate summary'}`);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
    setTimeout(() => setFeedbackSubmitted(false), 2000);
  };

  // Export history to CSV
  const handleExportToCSV = () => {
    if (history.length === 0) {
      alert('No history to export.');
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Output', 'Controls'];
    const csvContent = [
      headers.join(','),
      ...history.map(entry => [
        entry.date,
        `"${entry.output.replace(/"/g, '""')}"`, // Escape quotes in output
        `"${entry.controls.replace(/"/g, '""')}"` // Escape quotes in controls
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `research_summary_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="max-w-none mx-auto p-8 space-y-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <h1 className="text-3xl font-extrabold mb-2 tracking-tight text-primary">
        AI-Powered Research Summary Generator
      </h1>
      <p className="text-base text-gray-600 mb-6">
        Create professional, consistent research summaries for faculty profiles.
      </p>

      {/* Research Summary Generator Section */}
      <Card className="p-8 max-w-none mx-auto">
        <CardContent className="p-0">

          {/* Researcher Select */}
          <div className="mb-6">
            <Label className="font-semibold text-lg block mb-1">Select Researcher</Label>
            <span className="text-sm text-gray-500 italic block mb-2">Use CWID or name for any WCM-employed full-time faculty</span>
            <div className="relative w-full max-w-md">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Type to search..."
                value={selectedResearcher ? `${selectedResearcher.givenName} ${selectedResearcher.surname} (${selectedResearcher.cwid})` : facultyId}
                onChange={e => {
                  setFacultyId(e.target.value);
                  setSelectedResearcher(null);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                className="rounded-md border-gray-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-300 text-lg px-3 py-2 mb-0"
                autoComplete="off"
              />
              {/* Dropdown suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div ref={dropdownRef} className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow z-10">
                  {suggestions.map((s, idx) => (
                    <div
                      key={s.cwid}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedResearcher(s);
                        setFacultyId(s.cwid);
                        setShowSuggestions(false);
                      }}
                    >
                      {s.givenName} {s.surname} ({s.cwid})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Radio Groups */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            {/* Length */}
            <div>
              <Label className="font-semibold block mb-2">Length</Label>
              <RadioGroup value={length} onValueChange={setLength}>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Short" id="length-short" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="length-short">Short (phrase)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Medium" id="length-medium" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="length-medium">Medium (paragraph)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Extended" id="length-extended" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="length-extended">Extended overview</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            {/* Time Frame */}
            <div>
              <Label className="font-semibold block mb-2">Time Frame</Label>
              <RadioGroup value={timeframe} onValueChange={setTimeframe}>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Past 5 years" id="tf-5" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="tf-5">Past 5 years</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Past 10 years" id="tf-10" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="tf-10">Past 10 years</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Entire career" id="tf-career" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="tf-career">Entire career</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            {/* Voice */}
            <div>
              <Label className="font-semibold block mb-2">Voice</Label>
              <RadioGroup value={voice} onValueChange={setVoice}>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Third person" id="voice-third" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="voice-third">Third person</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="First person" id="voice-first" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="voice-first">First person</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            {/* Tone */}
            <div>
              <Label className="font-semibold block mb-2">Tone</Label>
              <RadioGroup value={summaryTone} onValueChange={setSummaryTone}>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Formal" id="tone-formal" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="tone-formal">Formal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Informal" id="tone-informal" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="tone-informal">Informal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Neutral" id="tone-neutral" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="tone-neutral">Neutral</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Kim Jong Un" id="tone-kju" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="tone-kju">Kim Jong Un</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            {/* Audience */}
            <div>
              <Label className="font-semibold block mb-2">Audience</Label>
              <RadioGroup value={audience} onValueChange={setAudience}>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="General public" id="audience-public" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="audience-public">General public</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Academic peers" id="audience-peers" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="audience-peers">Academic peers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Grant reviewers, funders" id="audience-grant" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="audience-grant">Grant reviewers, funders</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Prospective patients" id="audience-patients" className="text-blue-600 border-blue-600 focus:ring-blue-600" />
                    <Label htmlFor="audience-patients">Prospective patients</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Key Elements to Highlight */}
          <div className="mb-6">
            <Label className="font-semibold block mb-2">Key Elements to Highlight</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="highlight-problems" className="text-blue-600 border-blue-600 focus:ring-blue-600" checked={selectedKeyElements.includes('Research problems/questions')} onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedKeyElements([...selectedKeyElements, 'Research problems/questions']);
                  } else {
                    setSelectedKeyElements(selectedKeyElements.filter(el => el !== 'Research problems/questions'));
                  }
                }} />
                <Label htmlFor="highlight-problems">Research problems/questions</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="highlight-goals" className="text-blue-600 border-blue-600 focus:ring-blue-600" checked={selectedKeyElements.includes('Research goals')} onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedKeyElements([...selectedKeyElements, 'Research goals']);
                  } else {
                    setSelectedKeyElements(selectedKeyElements.filter(el => el !== 'Research goals'));
                  }
                }} />
                <Label htmlFor="highlight-goals">Research goals</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="highlight-methods" className="text-blue-600 border-blue-600 focus:ring-blue-600" checked={selectedKeyElements.includes('Research methods')} onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedKeyElements([...selectedKeyElements, 'Research methods']);
                  } else {
                    setSelectedKeyElements(selectedKeyElements.filter(el => el !== 'Research methods'));
                  }
                }} />
                <Label htmlFor="highlight-methods">Research methods</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="highlight-clinical" className="text-blue-600 border-blue-600 focus:ring-blue-600" checked={selectedKeyElements.includes('Clinical application')} onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedKeyElements([...selectedKeyElements, 'Clinical application']);
                  } else {
                    setSelectedKeyElements(selectedKeyElements.filter(el => el !== 'Clinical application'));
                  }
                }} />
                <Label htmlFor="highlight-clinical">Clinical application</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="highlight-grants" className="text-blue-600 border-blue-600 focus:ring-blue-600" checked={selectedKeyElements.includes('Grants received')} onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedKeyElements([...selectedKeyElements, 'Grants received']);
                  } else {
                    setSelectedKeyElements(selectedKeyElements.filter(el => el !== 'Grants received'));
                  }
                }} />
                <Label htmlFor="highlight-grants">Grants received</Label>
              </div>
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="mb-6">
            <Label className="font-semibold block mb-1">Additional Instructions</Label>
            <span className="text-sm text-gray-500 italic block mb-2">Examples: "Highlight major grants," "Omit middle-author publications." "Characterize change in interests over time."</span>
            <Textarea
              placeholder=""
              value={directive}
              onChange={e => setDirective(e.target.value)}
              className="w-full min-h-[48px] border-gray-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-300 rounded-md"
            />
          </div>

          {/* Generate Summary Button */}
          <Button 
            onClick={handleGenerateSummary} 
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-2 rounded-md mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating Summary...</span>
              </div>
            ) : (
              "Generate Summary"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Last generated output */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-2">Last generated output</h2>
        {summary ? (
          <div className="bg-gray-100 border border-gray-300 rounded p-4 mb-2 flex flex-col">
            <span className="text-xs text-gray-500 self-end mb-1">{summaryTimestamp}</span>
            <div className="italic text-gray-800">
              {summary}
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 border border-gray-300 rounded p-4 mb-2">
            <div className="text-gray-500 italic">No summary generated yet. Select a researcher, choose publications, and click "Generate Summary" to create your first summary.</div>
          </div>
        )}
      </div>

      {/* Source data */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-2">Source data</h2>
        <p className="text-sm text-gray-700 mb-2">Select data that will be used to generate the statement.</p>
        {/* Tabs */}
        <div className="flex space-x-2 mb-2">
          <button 
            className={`px-3 py-1 rounded font-semibold ${activeTab === 'publications' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('publications')}
          >
            Publications <span className="ml-1 text-xs font-normal">{publicationsArray.length}</span>
          </button>
          <button 
            className={`px-3 py-1 rounded font-semibold ${activeTab === 'grants' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('grants')}
          >
            Grants <span className="ml-1 text-xs font-normal">{grantsArray.length}</span>
          </button>
          <button 
            className={`px-3 py-1 rounded font-semibold ${activeTab === 'clinical-trials' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('clinical-trials')}
          >
            Clinical Trials <span className="ml-1 text-xs font-normal">{trialsArray.length}</span>
          </button>
          <button 
            className={`px-3 py-1 rounded font-semibold ${activeTab === 'clinical-specialties' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('clinical-specialties')}
          >
            Clinical Specialties <span className="ml-1 text-xs font-normal">{specialtiesArray.length}</span>
          </button>
        </div>
        {/* Controls */}
        <div className="flex items-center space-x-4 mb-2">
          {activeTab === 'publications' && (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox id="select-all" className="text-blue-600 border-blue-600 focus:ring-blue-600" checked={paginatedPubs.every(pub => selectedPubs.has(pub.pmid)) && paginatedPubs.length > 0} onCheckedChange={checked => {
                  const newSet = new Set(selectedPubs);
                  if (checked) {
                    paginatedPubs.forEach(pub => newSet.add(pub.pmid));
                  } else {
                    paginatedPubs.forEach(pub => newSet.delete(pub.pmid));
                  }
                  setSelectedPubs(newSet);
                }} />
                <Label htmlFor="select-all">Select all / none</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="include-abstracts" className="text-blue-600 border-blue-600 focus:ring-blue-600" checked={abstracts} onCheckedChange={(checked) => setAbstracts(checked === true)} />
                <Label htmlFor="include-abstracts">Include abstracts</Label>
              </div>
              <Input type="text" placeholder="Filter by PMID(s), article title, etc." className="w-64 ml-4 focus:border-blue-700 focus:ring-2 focus:ring-blue-300" />
            </>
          )}
          {activeTab === 'grants' && (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox id="select-all-grants" className="text-blue-600 border-blue-600 focus:ring-blue-600" checked={paginatedGrants.every(grant => selectedGrants.has(grant.id || grant.grant_id || JSON.stringify(grant))) && paginatedGrants.length > 0} onCheckedChange={checked => {
                  const newSet = new Set<string>(selectedGrants);
                  if (checked) {
                    // Select all grants on current page
                    paginatedGrants.forEach(grant => {
                      const grantId = grant.id || grant.grant_id || JSON.stringify(grant);
                      newSet.add(grantId);
                    });
                  } else {
                    // Deselect all grants on current page
                    paginatedGrants.forEach(grant => {
                      const grantId = grant.id || grant.grant_id || JSON.stringify(grant);
                      newSet.delete(grantId);
                    });
                  }
                  setSelectedGrants(newSet);
                }} />
                <Label htmlFor="select-all-grants">Select all / none</Label>
              </div>
              <Input type="text" placeholder="Filter grants..." className="w-64 ml-4 focus:border-blue-700 focus:ring-2 focus:ring-blue-300" />
            </>
          )}
          {activeTab === 'clinical-specialties' && (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox id="select-all-specialties" className="text-blue-600 border-blue-600 focus:ring-blue-600" checked={paginatedSpecialties.every(specialty => selectedSpecialties.has(specialty.personMesh)) && paginatedSpecialties.length > 0} onCheckedChange={checked => {
                  const newSet = new Set<string>(selectedSpecialties);
                  if (checked) {
                    // Select all specialties on current page
                    paginatedSpecialties.forEach(specialty => {
                      newSet.add(specialty.personMesh);
                    });
                  } else {
                    // Deselect all specialties on current page
                    paginatedSpecialties.forEach(specialty => {
                      newSet.delete(specialty.personMesh);
                    });
                  }
                  setSelectedSpecialties(newSet);
                }} />
                <Label htmlFor="select-all-specialties">Select all / none</Label>
              </div>
              <Input type="text" placeholder="Filter specialties..." className="w-64 ml-4 focus:border-blue-700 focus:ring-2 focus:ring-blue-300" />
            </>
          )}
          {activeTab === 'clinical-trials' && (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox id="select-all-trials" className="text-blue-600 border-blue-600 focus:ring-blue-600" checked={paginatedTrials.every(trial => selectedTrials.has(trial.nctNumber)) && paginatedTrials.length > 0} onCheckedChange={checked => {
                  const newSet = new Set<string>(selectedTrials);
                  if (checked) {
                    // Select all trials on current page
                    paginatedTrials.forEach(trial => {
                      newSet.add(trial.nctNumber);
                    });
                  } else {
                    // Deselect all trials on current page
                    paginatedTrials.forEach(trial => {
                      newSet.delete(trial.nctNumber);
                    });
                  }
                  setSelectedTrials(newSet);
                }} />
                <Label htmlFor="select-all-trials">Select all / none</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="include-trial-summaries" className="text-blue-600 border-blue-600 focus:ring-blue-600" checked={includeTrialSummaries} onCheckedChange={(checked) => setIncludeTrialSummaries(checked === true)} />
                <Label htmlFor="include-trial-summaries">Include summaries</Label>
              </div>
              <Input type="text" placeholder="Filter trials..." className="w-64 ml-4 focus:border-blue-700 focus:ring-2 focus:ring-blue-300" />
            </>
          )}
        </div>
        {/* Data list */}
        <div className="space-y-3 mt-2">
          {activeTab === 'publications' && (
            <>
              {paginatedPubs.length === 0 ? (
                <div className="text-gray-500 italic">No publications found.</div>
              ) : (
                paginatedPubs.map((pub, i) => (
                  <div key={pub.pmid} className="flex items-start space-x-2 bg-white border border-gray-200 rounded p-3">
                    <Checkbox id={`pub-${pub.pmid}`} className="mt-1 text-blue-600 border-blue-600 focus:ring-blue-600" checked={selectedPubs.has(pub.pmid)} onCheckedChange={checked => {
                      const newSet = new Set(selectedPubs);
                      if (checked) newSet.add(pub.pmid);
                      else newSet.delete(pub.pmid);
                      setSelectedPubs(newSet);
                    }} />
                    <div>
                      <div className="font-semibold mb-1">{pub.articleTitle}</div>
                      {pub.abstractVarchar && (
                        <div className="text-sm text-gray-700 mb-1 line-clamp-2">
                          {pub.abstractVarchar}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        PMID: {pub.pmid} &nbsp; Year: {pub.articleYear}. &nbsp; <span className="font-medium">Type:</span> {pub.publicationTypeCanonical}. &nbsp; <span className="font-medium">Author position:</span> {pub.authorPosition || 'N/A'}
                        <br />
                        <span className="font-medium">Significance score:</span> {pub.significanceScore}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
          
          {activeTab === 'grants' && (
            <>
              {paginatedGrants.length === 0 ? (
                <div className="text-gray-500 italic">No grants found.</div>
              ) : (
                paginatedGrants.map((grant, i) => {
                  const grantId = grant.id || grant.grant_id || JSON.stringify(grant);
                  return (
                    <div key={grantId} className="flex items-start space-x-2 bg-white border border-gray-200 rounded p-3">
                      <Checkbox id={`grant-${grantId}`} className="mt-1 text-blue-600 border-blue-600 focus:ring-blue-600" checked={selectedGrants.has(grantId)} onCheckedChange={checked => {
                        const newSet = new Set(selectedGrants);
                        if (checked) newSet.add(grantId);
                        else newSet.delete(grantId);
                        setSelectedGrants(newSet);
                      }} />
                      <div>
                        <div className="font-semibold mb-1">
                          {grant.proj_title || 'Untitled Grant'}
                        </div>
                        <div className="text-xs text-gray-500 space-x-4">
                          {grant.Orig_Sponsor && <span><span className="font-medium">Agency:</span> {grant.Orig_Sponsor}</span>}
                          {grant.Award_Number && <span><span className="font-medium">Award #:</span> {grant.Award_Number}</span>}
                          {grant.begin_date && <span><span className="font-medium">Start:</span> {grant.begin_date}</span>}
                          {grant.end_date && <span><span className="font-medium">End:</span> {grant.end_date}</span>}
                          {grant.Role && <span><span className="font-medium">Role:</span> {grant.Role}</span>}
                          {grant.unit_name && <span><span className="font-medium">Unit:</span> {grant.unit_name}</span>}
                        </div>
                        {grant.abstract && (
                          <div className="text-sm text-gray-700 mt-1 line-clamp-2">
                            {grant.abstract}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
          
          {activeTab === 'clinical-trials' && (
            <>
              {paginatedTrials.length === 0 ? (
                <div className="text-gray-500 italic">No clinical trials found.</div>
              ) : (
                paginatedTrials.map((trial, i) => (
                  <div key={trial.nctNumber} className="flex items-start space-x-2 bg-white border border-gray-200 rounded p-3">
                    <Checkbox id={`trial-${trial.nctNumber}`} className="mt-1 text-blue-600 border-blue-600 focus:ring-blue-600" checked={selectedTrials.has(trial.nctNumber)} onCheckedChange={checked => {
                      const newSet = new Set<string>(selectedTrials);
                      if (checked) newSet.add(trial.nctNumber);
                      else newSet.delete(trial.nctNumber);
                      setSelectedTrials(newSet);
                    }} />
                    <div>
                      <div className="font-semibold mb-1">{trial.title}</div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Protocol Type:</span> {trial.protocolType} &nbsp; &nbsp;
                        <span className="font-medium">NCT Number:</span> {trial.nctNumber}
                      </div>
                      {trial.briefSummary && (
                        <div className="text-sm text-gray-700 mt-1 line-clamp-2">
                          {trial.briefSummary}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
          
          {activeTab === 'clinical-specialties' && (
            <>
              {paginatedSpecialties.length === 0 ? (
                <div className="text-gray-500 italic">No clinical specialties found.</div>
              ) : (
                paginatedSpecialties.map((specialty, i) => (
                  <div key={specialty.personMesh} className="flex items-start space-x-2 bg-white border border-gray-200 rounded p-3">
                    <Checkbox id={`specialty-${specialty.personMesh}`} className="mt-1 text-blue-600 border-blue-600 focus:ring-blue-600" checked={selectedSpecialties.has(specialty.personMesh)} onCheckedChange={checked => {
                      const newSet = new Set<string>(selectedSpecialties);
                      if (checked) newSet.add(specialty.personMesh);
                      else newSet.delete(specialty.personMesh);
                      setSelectedSpecialties(newSet);
                    }} />
                    <div>
                      <div className="font-semibold mb-1">{specialty.personMesh}</div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Score:</span> {specialty.scoreBestMatch}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
        {/* Pagination controls */}
        {activeTab === 'publications' && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-4">
            <Button
              className="px-3 py-1"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">Page {currentPage + 1} of {totalPages}</span>
            <Button
              className="px-3 py-1"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
        {activeTab === 'grants' && totalGrantsPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-4">
            <Button
              className="px-3 py-1"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">Page {currentPage + 1} of {totalGrantsPages}</span>
            <Button
              className="px-3 py-1"
              disabled={currentPage >= totalGrantsPages - 1}
              onClick={() => setCurrentPage(p => Math.min(totalGrantsPages - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
        {activeTab === 'clinical-specialties' && totalSpecialtiesPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-4">
            <Button
              className="px-3 py-1"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">Page {currentPage + 1} of {totalSpecialtiesPages}</span>
            <Button
              className="px-3 py-1"
              disabled={currentPage >= totalSpecialtiesPages - 1}
              onClick={() => setCurrentPage(p => Math.min(totalSpecialtiesPages - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
        {activeTab === 'clinical-trials' && totalTrialsPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-4">
            <Button
              className="px-3 py-1"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">Page {currentPage + 1} of {totalTrialsPages}</span>
            <Button
              className="px-3 py-1"
              disabled={currentPage >= totalTrialsPages - 1}
              onClick={() => setCurrentPage(p => Math.min(totalTrialsPages - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* History */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-2">History</h2>
        <div className="flex justify-end mb-2">
          <Button 
            onClick={handleExportToCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
          >
            Export to CSV
          </Button>
        </div>
        {history.length > 0 ? (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left font-semibold">Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Output</th>
                  <th className="px-4 py-2 text-left font-semibold">Controls</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 align-top">{entry.date}</td>
                    <td className="px-4 py-2 align-top">
                      {entry.output.length > 100 
                        ? `${entry.output.substring(0, 100)}...` 
                        : entry.output
                      }
                    </td>
                    <td className="px-4 py-2 align-top">{entry.controls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="text-gray-500 italic">No history yet. Generate your first summary to see it here.</div>
          </div>
        )}
      </div>

      <footer className="text-sm text-gray-500 border-t pt-4 text-center">
        © 2024 Your Institution Name. For internal use only.
      </footer>
    </main>
  );
}
