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

export default function Home() {
  // State for form fields
  const [facultyId, setFacultyId] = useState("");
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [suggestions, setSuggestions] = useState<Researcher[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [grants, setGrants] = useState(false);
  const [abstracts, setAbstracts] = useState(false);

  const [voice, setVoice] = useState("Third-person");
  const [length, setLength] = useState("Medium");
  const [timeframe, setTimeframe] = useState("Past 5 years");
  const [directive, setDirective] = useState("");
  const [audience, setAudience] = useState("General public");
  const [selectedKeyElements, setSelectedKeyElements] = useState<string[]>([]);

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

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedPubs, setSelectedPubs] = useState<Set<number>>(new Set());
  const pageSize = 5;

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

  useEffect(() => {
    setCurrentPage(0); // Reset to first page when publications change
  }, [publications]);

  // Publication pagination logic - ensure publications is always an array
  const publicationsArray = Array.isArray(publications) ? publications : [];
  const paginatedPubs = publicationsArray.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(publicationsArray.length / pageSize);

  // Generate or regenerate summary
  const handleGenerateSummary = async () => {
    if (!selectedResearcher || selectedPubs.size === 0) {
      alert('Please select a researcher and at least one publication.');
      return;
    }

    try {
      const selectedPublications = publications.filter(pub => selectedPubs.has(pub.pmid));
      
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedPublications,
          researcherName: `${selectedResearcher.givenName} ${selectedResearcher.surname}`,
          length,
          timeframe,
          voice,
          tone: summaryTone,
          audience,
          keyElements: selectedKeyElements,
          additionalInstructions: directive
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
          output: newSummary.substring(0, 100) + (newSummary.length > 100 ? '...' : ''),
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
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
    setTimeout(() => setFeedbackSubmitted(false), 2000);
  };

  return (
    <main className="max-w-2xl mx-auto p-8 space-y-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <h1 className="text-3xl font-extrabold mb-2 tracking-tight text-primary">
        AI-Powered Research Summary Generator
      </h1>
      <p className="text-base text-gray-600 mb-6">
        Create professional, consistent research summaries for faculty profiles.
      </p>

      {/* Research Summary Generator Section - matches screenshot */}
      <Card className="p-8 max-w-3xl mx-auto">
        <CardContent className="p-0">
          {/* Title and subtitle */}
          <h1 className="text-3xl font-bold mb-1">AI Research Summary Generator</h1>
          <p className="text-base text-gray-700 mb-6">Create a professional research summary based on your selected criteria.</p>

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
                className="rounded-md border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg px-3 py-2 mb-0"
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
                    <RadioGroupItem value="Short" id="length-short" />
                    <Label htmlFor="length-short">Short (phrase)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Medium" id="length-medium" />
                    <Label htmlFor="length-medium">Medium (paragraph)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Extended" id="length-extended" />
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
                    <RadioGroupItem value="Past 5 years" id="tf-5" />
                    <Label htmlFor="tf-5">Past 5 years</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Past 10 years" id="tf-10" />
                    <Label htmlFor="tf-10">Past 10 years</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Entire career" id="tf-career" />
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
                    <RadioGroupItem value="Third person" id="voice-third" />
                    <Label htmlFor="voice-third">Third person</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="First person" id="voice-first" />
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
                    <RadioGroupItem value="Formal" id="tone-formal" />
                    <Label htmlFor="tone-formal">Formal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Informal" id="tone-informal" />
                    <Label htmlFor="tone-informal">Informal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Neutral" id="tone-neutral" />
                    <Label htmlFor="tone-neutral">Neutral</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Kim Jong Un" id="tone-kju" />
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
                    <RadioGroupItem value="General public" id="audience-public" />
                    <Label htmlFor="audience-public">General public</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Academic peers" id="audience-peers" />
                    <Label htmlFor="audience-peers">Academic peers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Grant reviewers, funders" id="audience-grant" />
                    <Label htmlFor="audience-grant">Grant reviewers, funders</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Prospective patients" id="audience-patients" />
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
                <Checkbox id="highlight-problems" checked={selectedKeyElements.includes('Research problems/questions')} onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedKeyElements([...selectedKeyElements, 'Research problems/questions']);
                  } else {
                    setSelectedKeyElements(selectedKeyElements.filter(el => el !== 'Research problems/questions'));
                  }
                }} />
                <Label htmlFor="highlight-problems">Research problems/questions</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="highlight-goals" checked={selectedKeyElements.includes('Research goals')} onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedKeyElements([...selectedKeyElements, 'Research goals']);
                  } else {
                    setSelectedKeyElements(selectedKeyElements.filter(el => el !== 'Research goals'));
                  }
                }} />
                <Label htmlFor="highlight-goals">Research goals</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="highlight-context" checked={selectedKeyElements.includes('Context of research')} onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedKeyElements([...selectedKeyElements, 'Context of research']);
                  } else {
                    setSelectedKeyElements(selectedKeyElements.filter(el => el !== 'Context of research'));
                  }
                }} />
                <Label htmlFor="highlight-context">Context of research</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="highlight-clinical" checked={selectedKeyElements.includes('Clinical application')} onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedKeyElements([...selectedKeyElements, 'Clinical application']);
                  } else {
                    setSelectedKeyElements(selectedKeyElements.filter(el => el !== 'Clinical application'));
                  }
                }} />
                <Label htmlFor="highlight-clinical">Clinical application</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="highlight-findings" checked={selectedKeyElements.includes('Key findings & significance')} onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedKeyElements([...selectedKeyElements, 'Key findings & significance']);
                  } else {
                    setSelectedKeyElements(selectedKeyElements.filter(el => el !== 'Key findings & significance'));
                  }
                }} />
                <Label htmlFor="highlight-findings">Key findings & significance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="highlight-methods" checked={selectedKeyElements.includes('Research methods')} onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedKeyElements([...selectedKeyElements, 'Research methods']);
                  } else {
                    setSelectedKeyElements(selectedKeyElements.filter(el => el !== 'Research methods'));
                  }
                }} />
                <Label htmlFor="highlight-methods">Research methods</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="highlight-innovative" checked={selectedKeyElements.includes('Innovative aspects')} onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedKeyElements([...selectedKeyElements, 'Innovative aspects']);
                  } else {
                    setSelectedKeyElements(selectedKeyElements.filter(el => el !== 'Innovative aspects'));
                  }
                }} />
                <Label htmlFor="highlight-innovative">Innovative aspects</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="highlight-recent" checked={selectedKeyElements.includes('Recent work')} onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedKeyElements([...selectedKeyElements, 'Recent work']);
                  } else {
                    setSelectedKeyElements(selectedKeyElements.filter(el => el !== 'Recent work'));
                  }
                }} />
                <Label htmlFor="highlight-recent">Recent work</Label>
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
              className="w-full min-h-[48px] border-gray-400 rounded-md"
            />
          </div>

          {/* Generate Summary Button */}
          <Button onClick={handleGenerateSummary} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-2 rounded-md mt-2">
            Generate Summary
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
          <button className="bg-gray-800 text-white px-3 py-1 rounded font-semibold">
            Publications <span className="ml-1 text-xs font-normal">{selectedPubs.size}</span>
          </button>
          <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded">Grants <span className="ml-1 text-xs">8</span></button>
          <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded">Clinical Trials <span className="ml-1 text-xs">7</span></button>
          <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded">Clinical Specialties <span className="ml-1 text-xs">9</span></button>
        </div>
        {/* Controls */}
        <div className="flex items-center space-x-4 mb-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="select-all" checked={paginatedPubs.every(pub => selectedPubs.has(pub.pmid)) && paginatedPubs.length > 0} onCheckedChange={checked => {
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
            <Checkbox id="include-abstracts" />
            <Label htmlFor="include-abstracts">Include abstracts</Label>
          </div>
          <Input type="text" placeholder="Filter by PMID(s), article title, etc." className="w-64 ml-4" />
        </div>
        {/* Publication list */}
        <div className="space-y-3 mt-2">
          {paginatedPubs.length === 0 ? (
            <div className="text-gray-500 italic">No publications found.</div>
          ) : (
            paginatedPubs.map((pub, i) => (
              <div key={pub.pmid} className="flex items-start space-x-2 bg-white border border-gray-200 rounded p-3">
                <Checkbox id={`pub-${pub.pmid}`} className="mt-1" checked={selectedPubs.has(pub.pmid)} onCheckedChange={checked => {
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
        </div>
        {/* Pagination controls */}
        {totalPages > 1 && (
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
      </div>

      {/* History */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-2">History</h2>
        <div className="flex justify-end mb-2">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded">Export to CSV</Button>
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
                    <td className="px-4 py-2 align-top">{entry.output}</td>
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
