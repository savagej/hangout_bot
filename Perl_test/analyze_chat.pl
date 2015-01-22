#! /usr/bin/perl

use strict;
use warnings;

my $stopwords = shift @ARGV;

open(my $stp_fh, "<", "$stopwords");
my @stop_words;
while (<$stp_fh>) {
  chomp;
  push @stop_words, $_;
}
my $input = shift @ARGV;

my (@john_words,@julie_words);

# Loop through the people that have sent mails and extract the body of each mail they've sent
#foreach my $emails (keys %from_people) {
#my $from_or_to = "To:";
my $from_or_to = "From:";
my @emails = ("<carty.julie\@gmail.com>","<cartyjulie\@gmail.com>");
open (my $fh, "<", "$input") or die "Can't open input";
my @one_mail;
while (<$fh>) {
  chomp;
  if (/\@xxx/) { # @xxx seems to be the first line of every mail
    if (@one_mail == 0) {
      push @one_mail, $_;
      next;
    } else {
      &parse_one_mail(@one_mail);
      @one_mail = ();
      push @one_mail, $_;
    }
  } else {
    push @one_mail, $_;
  }
}

&print_out("Julie",@julie_words);
&print_out("John",@john_words);
 
sub parse_one_mail {
  my $mail_ref = \@_;
  my $array_count = -1;
  my $print_message = 0;
  my $from_switch = 0;
  my $to_switch = 0;
  my $multipart_switch = 0;
  foreach my $line (@$mail_ref) {
    $array_count ++;
    $multipart_switch = 1 if ($line =~ /Content-Type: multipart/);

    if ($line =~ /X-Gmail-Labels/) {
      my $chat_label_test = (split(/\s+/,$line))[1];
      last unless $chat_label_test eq 'Chat';
    }

    if ($line =~ /From:/) {
      my @from_line = split(/\s+/,$line);
      my $from_test = shift @from_line;
      next unless $from_test eq "From:";
      my $email = pop @from_line;
      my $person = join(' ',@from_line);
      if (($email eq $emails[0]) || ($email eq $emails[1])) {
        $print_message = 1;
        $from_switch = 1;
      }
      next;
    } 
    if ($line =~ /To:/) {
      my @to_line = split(/\s+/,$line);
      my $to_test = shift @to_line;
      next unless $to_test eq "To:";
      my $email = pop @to_line;
      my $person = join(' ',@to_line);
      if (($email eq $emails[0]) || ($email eq $emails[1])) {
        $print_message = 1;
        $to_switch = 1;
      }
      next;
    } 
 
    if (($print_message == 1) && ($line =~ /Content-Type: text/)) {
      if ($multipart_switch == 0) {
        #print "$$mail_ref[$array_count-6] : $$mail_ref[$array_count+3]\n";
        #print "$$mail_ref[$array_count+3]\n";
        push @john_words, split(/\s+/,$$mail_ref[$array_count+3]) if $to_switch == 1;
        push @julie_words, split(/\s+/,$$mail_ref[$array_count+3]) if $from_switch == 1;
        last;
      } else {
        #print STDERR "Analysing from lines $array_count..$#$mail_ref\n";
        #foreach my $ccc (@$mail_ref[$array_count..$#$mail_ref]) {
        #  print "$ccc\n";
        #}
        &analyse_multipart(@$mail_ref[$array_count..$#$mail_ref]);
        last;
      }
    }
  }
}

sub analyse_multipart {
  my $altogether = join('',@_);
  my $no_equal = join('',split(/\=/,$altogether));
  my @split_line = split(/<[^>^<\r\n]*>/,$no_equal);
  #print "$bit\n@split_line\n";
  #print "$altogether\n\n@split_line\n";
  #print "@split_line\n";
  foreach my $ii (0..$#split_line) {
    #print "\t$split_line[$ii]\n" if $split_line[$ii] =~ /Part/;
    if ($split_line[$ii] =~ /:/) {
      next if $split_line[$ii] =~ /Content-Type/;
      #print "NAME: $split_line[$ii-1] SPLITTER: $split_line[$ii]\n";
#      print "NAME: $split_line[$ii-1]\n";
      #print "$split_line[$ii]\n";
      if ($split_line[$ii-1] =~ /me/) {
        my @bits = split(/\s+/,$split_line[$ii]);
        shift @bits;
        push @john_words, @bits;
        #print "JOHN: @bits\n";
      } elsif ($split_line[$ii-1] =~ /Julie/) {
        my @bits = split(/\s+/,$split_line[$ii]);
        shift @bits;
        push @julie_words, @bits;
        #print "JULIE: @bits\n";
      } else {
        #print "NOTHING: $split_line[$ii]\n";
      }
    }
  }
}

sub print_out {
  my %word_count;
  my $name = shift @_;
  print "Words for $name\n";
  my @print_words = @_;
  foreach my $word (@print_words) {
    $word =~ s/\&\#39\;/'/g;
    $word =~ s/,//g;
    $word =~ s/\.//g;
    $word =~ s/\?//g;
    $word =~ s/\!//g;
    $word =~ s/\&lt\;/</g;
    $word = lc($word);
    $word_count{$word}++;
  }
  foreach my $stpwrd (@stop_words) {
    $word_count{$stpwrd} = -1;
  }
  print "\n\n\n";
  my $count = 0;
  foreach my $word (sort {$word_count{$b} <=> $word_count{$a}} keys %word_count) {
    $count ++;
    last if $word_count{$word} < 3;
    foreach (1..$word_count{$word}) {
      print "$word ";
    }
  }
  print "\n";
  print "Count $count\n";
}
