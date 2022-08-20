#!/bin/perl
use File::Copy;

opendir(DIR, ".") || die "can't open .\n";
while ($file = readdir(DIR)){
  if ($file =~ /\s\(\d+\).png/){
    $out = $file;
    $out =~ s/\s//;
    copy($file,$out) || die("Copy failed '$file' => '$out'\n");
  }	  
}
closedir(DIR);

