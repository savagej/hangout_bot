#! /usr/bin/perl

use strict;
use warnings;

my $input = shift @ARGV;

# Get the list of people who are in the emails, in both the from and to lines and how many messages in each
my (%from_people_already_seen,%from_people,%from_message_counts);
my (%to_people_already_seen,%to_people,%to_message_counts);

open (my $fh, "<", "$input") or die "Can't open input";
while (<$fh>) {
  if (/From:/) {
    my @from_line = split;
    my $from_test = shift @from_line;
    next unless $from_test eq "From:";
    my $email = pop @from_line;
    my $person = join(' ',@from_line);
    push @{$from_people{$email}}, $person unless exists($from_people_already_seen{$person});
    $from_people_already_seen{$person} = 1;
    $from_message_counts{$email} ++;
  } elsif (/To:/) {
    my @to_line = split;
    my $to_test = shift @to_line;
    next unless $to_test eq "To:";
    my $email = pop @to_line;
    my $person = join(' ',@to_line);
    push @{$to_people{$email}}, $person unless exists($to_people_already_seen{$person});
    $to_people_already_seen{$person} = 1;
    $to_message_counts{$email} ++;
  }
}
close $fh;
print "FROMS\n";
foreach my $emails (keys %from_people) {
  print "$emails NAMES: @{$from_people{$emails}}\tNum messages:$from_message_counts{$emails}\n";
}
print "TOS\n";
foreach my $emails (keys %to_people) {
  print "$emails NAMES: @{$to_people{$emails}}\tNum messages:$to_message_counts{$emails}\n";
}

# Loop through the people that have sent mails and extract the body of each mail they've sent
#foreach my $emails (keys %from_people) {
foreach my $emails ("<cartyjulie\@gmail.com>") {
  open (my $fh, "<", "$input") or die "Can't open input";
  print "Messages from $emails:\nSTART\n";
  <>;
  my @one_mail;
  while (<$fh>) {
    chomp;
    if (/\@xxx/) { # @xxx seems to be the first line of every mail
      if (@one_mail == 0) {
        push @one_mail, $_;
        next;
      } else {
        &parse_one_mail($emails,@one_mail);
        @one_mail = ();
        push @one_mail, $_;
      }
    } else {
      push @one_mail, $_;
    }
  }
}
 
sub parse_one_mail {
  my $search_email = shift @_;
  my $mail_ref = \@_;
  my $array_count = -1;
  my $print_message = 0;
  my $multipart_switch = 0;
  foreach my $line (@$mail_ref) {
    $array_count ++;
    $multipart_switch = 1 if ($line =~ /Content-Type: multipart/);
    if ($line =~ /From:/) {
      my @from_line = split(/\s+/,$line);
      my $from_test = shift @from_line;
      next unless $from_test eq "From:";
      my $email = pop @from_line;
      my $person = join(' ',@from_line);
      $print_message = 1 if ($email eq $search_email);
      next;
    } 
    if (($print_message == 1) && ($line =~ /Content-Type: text\/html/)) {
      if ($multipart_switch == 0) {
        #print "$$mail_ref[$array_count-6] : $$mail_ref[$array_count+3]\n";
        print "$$mail_ref[$array_count+3]\n";
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
      print "$split_line[$ii]\n";
    }
  }
}
